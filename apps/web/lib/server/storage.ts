import { createHmac, timingSafeEqual } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { serverEnv } from '@/lib/env';

/**
 * Evidence storage (SPEC 6, 11): private bucket, short-lived signed upload URLs, object keys
 * we generate (never the uploader's file name).
 *
 *  - supabase: Supabase Storage signed upload URLs. Browser uploads straight to storage, so
 *    large files (video up to 200 MB) never pass through our serverless functions.
 *  - local: development and E2E only. URLs point at /api/uploads/<token>, an HMAC-signed,
 *    expiring token that names exactly one object and its max size. Refused in production
 *    unless ALLOW_LOCAL_STORAGE=1 (single-server deployments with a persistent disk).
 */
export const BUCKET = 'evidence';
export const UPLOAD_URL_TTL_SECONDS = 300; // SPEC 11: 5-minute signed URLs

export type StorageDriver = 'supabase' | 'local';

export function storageDriver(): StorageDriver {
  const explicit = process.env.STORAGE_DRIVER;
  if (explicit === 'local' || explicit === 'supabase') return explicit;
  return serverEnv().serviceRoleKey ? 'supabase' : 'local';
}

/** Local driver folder. Defaults to the OS temp dir (shared with the worker's default). */
export function localDir(): string {
  return path.resolve(
    /* turbopackIgnore: true */ process.env.STORAGE_LOCAL_DIR ||
      path.join(tmpdir(), 'rmmm-storage'),
  );
}

function signingSecret(): string {
  const s = process.env.UPLOAD_SIGNING_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.NODE_ENV === 'production')
    throw new Error('UPLOAD_SIGNING_SECRET (32+ chars) is required for local storage');
  return 'development-only-upload-signing-secret-000';
}

export function objectKey(reportId: string, mediaId: string, ext: string) {
  return `reports/${reportId}/${mediaId}.${ext.replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'bin'}`;
}

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};
export const extForMime = (mime: string) => EXT[mime.split(';')[0]!.trim().toLowerCase()] ?? 'bin';

// ---------- local driver: signed tokens ----------

interface LocalToken {
  k: string; // object key
  m: number; // max bytes
  e: number; // expiry (unix seconds)
  i: string; // media id
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString('base64url');

export function signLocalToken(t: LocalToken): string {
  const body = b64u(JSON.stringify(t));
  const sig = createHmac('sha256', signingSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyLocalToken(
  token: string,
  now = Math.floor(Date.now() / 1000),
): LocalToken | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', signingSecret()).update(body).digest();
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const t = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as LocalToken;
    if (typeof t.k !== 'string' || !t.k.startsWith('reports/') || t.k.includes('..')) return null;
    return t.e >= now ? t : null;
  } catch {
    return null;
  }
}

export async function writeLocalObject(key: string, data: Uint8Array) {
  const file = path.join(localDir(), BUCKET, key);
  if (!file.startsWith(path.join(localDir(), BUCKET) + path.sep)) throw new Error('bad key');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

// ---------- signed upload URLs ----------

export interface SignedUpload {
  url: string;
  method: 'PUT';
  headers: Record<string, string>;
  expiresIn: number;
}

export async function createSignedUpload(
  key: string,
  mime: string,
  maxBytes: number,
  mediaId: string,
): Promise<SignedUpload> {
  if (storageDriver() === 'local') {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_LOCAL_STORAGE !== '1') {
      throw new Error('local storage is disabled in production');
    }
    const token = signLocalToken({
      k: key,
      m: maxBytes,
      e: Math.floor(Date.now() / 1000) + UPLOAD_URL_TTL_SECONDS,
      i: mediaId,
    });
    return {
      url: `/api/uploads/${token}`,
      method: 'PUT',
      headers: { 'content-type': mime },
      expiresIn: UPLOAD_URL_TTL_SECONDS,
    };
  }
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  const base = supabaseUrl!.replace(/\/$/, '');
  const res = await fetch(`${base}/storage/v1/object/upload/sign/${BUCKET}/${key}`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ expiresIn: UPLOAD_URL_TTL_SECONDS }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`storage sign failed: ${res.status}`);
  const { url } = (await res.json()) as { url: string };
  return {
    url: `${base}/storage/v1${url}`,
    method: 'PUT',
    headers: { 'content-type': mime, 'x-upsert': 'false' },
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  };
}

/** True when the object exists (used to confirm a direct-to-storage upload finished). */
export async function objectExists(key: string): Promise<number | null> {
  if (storageDriver() === 'local') {
    const { stat } = await import('node:fs/promises');
    try {
      return (await stat(path.join(localDir(), BUCKET, key))).size;
    } catch {
      return null;
    }
  }
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  const res = await fetch(
    `${supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/info/authenticated/${BUCKET}/${key}`,
    {
      headers: { apikey: serviceRoleKey!, authorization: `Bearer ${serviceRoleKey}` },
      signal: AbortSignal.timeout(8000),
    },
  );
  if (!res.ok) return null;
  const info = (await res.json().catch(() => ({}))) as {
    size?: number;
    metadata?: { size?: number };
  };
  return info.size ?? info.metadata?.size ?? 0;
}

export async function deleteObject(key: string) {
  if (storageDriver() === 'local') {
    const { rm } = await import('node:fs/promises');
    await rm(path.join(localDir(), BUCKET, key), { force: true });
    return;
  }
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  await fetch(`${supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ prefixes: [key] }),
    signal: AbortSignal.timeout(8000),
  });
}

/** Server-side read (staff evidence viewer). Never hand storage URLs for originals to browsers. */
export async function readObject(key: string): Promise<Buffer | null> {
  if (storageDriver() === 'local') {
    const { readFile } = await import('node:fs/promises');
    const file = path.join(localDir(), BUCKET, key);
    if (!file.startsWith(path.join(localDir(), BUCKET) + path.sep)) return null;
    return readFile(file).catch(() => null);
  }
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  const res = await fetch(
    `${supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/authenticated/${BUCKET}/${key}`,
    {
      headers: { apikey: serviceRoleKey!, authorization: `Bearer ${serviceRoleKey}` },
      signal: AbortSignal.timeout(60_000),
    },
  );
  return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
}

export async function writeObject(key: string, data: Uint8Array, mime: string): Promise<void> {
  if (storageDriver() === 'local') return writeLocalObject(key, data);
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  const res = await fetch(`${supabaseUrl!.replace(/\/$/, '')}/storage/v1/object/${BUCKET}/${key}`, {
    method: 'PUT',
    headers: {
      apikey: serviceRoleKey!,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': mime,
      'x-upsert': 'true',
    },
    body: new Blob([new Uint8Array(data)], { type: mime }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`storage write failed: ${res.status}`);
}

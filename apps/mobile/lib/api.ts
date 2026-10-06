import * as SecureStore from 'expo-secure-store';
import { installId } from './device';
import { supabase } from './supabase';

/**
 * The app talks to the same route handlers as the website (apps/web/app/api). Anonymous
 * drafts and claims are "<id>.<token>" pairs kept in the keychain and sent as headers; a
 * signed-in member sends their Supabase access token.
 */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? '').replace(/\/$/, '');

const DRAFT_KEY = 'rmmm.report_draft';
const CLAIM_KEY = 'rmmm.report_claim';

export const draftToken = {
  get: () => SecureStore.getItemAsync(DRAFT_KEY),
  set: (v: string) => SecureStore.setItemAsync(DRAFT_KEY, v),
  clear: () => SecureStore.deleteItemAsync(DRAFT_KEY),
};
export const claimToken = {
  get: () => SecureStore.getItemAsync(CLAIM_KEY),
  set: (v: string) => SecureStore.setItemAsync(CLAIM_KEY, v),
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; fields: Record<string, string> };

export async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'x-rmmm-device': await installId() };
  const token = (await supabase()?.auth.getSession())?.data.session?.access_token;
  if (token) headers.authorization = `Bearer ${token}`;
  const draft = await draftToken.get();
  if (draft) headers['x-rmmm-draft'] = draft;
  const claim = await claimToken.get();
  if (claim) headers['x-rmmm-claim'] = claim;
  return headers;
}

export async function api<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<ApiResult<T>> {
  if (!WEB_URL) return { ok: false, status: 0, message: '', fields: {} };
  try {
    const res = await fetch(`${WEB_URL}${path}`, {
      method,
      headers: {
        ...(await authHeaders()),
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as
      (T & { message?: string; fields?: Record<string, string> }) | null;
    if (res.ok) return { ok: true, data: data as T };
    return {
      ok: false,
      status: res.status,
      message: data?.message ?? '',
      fields: data?.fields ?? {},
    };
  } catch {
    return { ok: false, status: 0, message: '', fields: {} };
  }
}

/** PUT a local file (file:// uri) to a signed upload URL. */
export async function uploadFile(
  upload: { url: string; headers: Record<string, string> },
  uri: string,
): Promise<boolean> {
  const url = upload.url.startsWith('/') ? `${WEB_URL}${upload.url}` : upload.url;
  try {
    const blob = await (await fetch(uri)).blob();
    const res = await fetch(url, { method: 'PUT', headers: upload.headers, body: blob });
    return res.ok;
  } catch {
    return false;
  }
}

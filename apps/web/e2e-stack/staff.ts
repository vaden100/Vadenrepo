import { execFileSync } from 'node:child_process';
import { createHmac, randomUUID } from 'node:crypto';
import type { BrowserContext } from '@playwright/test';

/**
 * Test-only staff sessions: a real Postgres user + profile, and an HS256 access token that
 * PostgREST and the e2e gateway's /auth/v1/user accept. Nothing here exists in production.
 */
export const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:3311';
const SUPABASE = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SECRET = process.env.JWT_SECRET ?? '';

export const psql = (sql: string) =>
  execFileSync('psql', ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8',
  }).trim();

export function createUser(role: 'member' | 'moderator' | 'editor' | 'admin'): string {
  const id = randomUUID();
  psql(`insert into auth.users (id, email) values ('${id}', '${id}@e2e.demo')`);
  psql(
    `select set_config('rmmm.trusted_write', 'on', false); update public.profiles set role = '${role}', display_name = '${role} ${id.slice(0, 4)}', age_confirmed_at = now(), terms_accepted_at = now(), terms_version = '2026-10-05' where id = '${id}'`,
  );
  return id;
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');

export function accessToken(sub: string, aal: 'aal1' | 'aal2' = 'aal2') {
  const now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64({
    sub,
    role: 'authenticated',
    aud: 'authenticated',
    aal,
    email: `${sub}@e2e.demo`,
    iat: now,
    exp: now + 3600,
  });
  return `${head}.${body}.${createHmac('sha256', SECRET).update(`${head}.${body}`).digest('base64url')}`;
}

/** Signs a browser context in the way @supabase/ssr stores sessions. */
export async function signIn(context: BrowserContext, sub: string, aal: 'aal1' | 'aal2' = 'aal2') {
  const now = Math.floor(Date.now() / 1000);
  const session = {
    access_token: accessToken(sub, aal),
    refresh_token: 'e2e-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    user: {
      id: sub,
      aud: 'authenticated',
      role: 'authenticated',
      email: `${sub}@e2e.demo`,
      app_metadata: {},
      user_metadata: {},
    },
  };
  await context.addCookies([
    {
      name: `sb-${new URL(SUPABASE).hostname.split('.')[0]}-auth-token`,
      value: `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,
      url: WEB,
    },
  ]);
}

/** An anonymous report sent the way the mobile app sends it, from a given IP and device. */
export async function sendReport(ip: string, device: string, name = 'Ban Demo Braids') {
  const headers = {
    'x-rmmm-device': device,
    'x-forwarded-for': ip,
    'content-type': 'application/json',
  };
  const call = (method: string, p: string, body?: unknown, extra: Record<string, string> = {}) =>
    fetch(WEB + p, {
      method,
      headers: { ...headers, ...extra },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const { id, draftToken } = (await (
    await call('POST', '/api/reports', { category: 'deposit_no_show' })
  ).json()) as { id: string; draftToken: string };
  const auth = { 'x-rmmm-draft': draftToken };
  await call(
    'PATCH',
    `/api/reports/${id}`,
    {
      who: { businessName: name, cashtag: `$${name.replace(/\W/g, '')}` },
      story: 'Paid a deposit for braids, they never showed and blocked me.',
    },
    auth,
  );
  const res = await call(
    'POST',
    `/api/reports/${id}/submit`,
    { consentTruth: true, consentTerms: true, ageConfirmed: true },
    auth,
  );
  if (res.status !== 201) throw new Error(`submit failed: ${res.status} ${await res.text()}`);
  return { id, ...((await res.json()) as { code: string }) };
}

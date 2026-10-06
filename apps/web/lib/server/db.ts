import { serverEnv } from '@/lib/env';

/**
 * Service-role access to PostgREST for route handlers (server only, never imported by
 * client code). Every call site must have checked ownership or staff access first.
 */
export class DbUnavailable extends Error {
  override name = 'DbUnavailable';
}

function conn() {
  const { supabaseUrl, serviceRoleKey } = serverEnv();
  if (!supabaseUrl || !serviceRoleKey) throw new DbUnavailable('database not configured');
  return { base: `${supabaseUrl.replace(/\/$/, '')}/rest/v1`, key: serviceRoleKey };
}

async function call<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const { base, key } = conn();
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(init.prefer ? { prefer: init.prefer } : {}),
      ...init.headers,
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(
      `db ${init.method ?? 'GET'} ${path.split('?')[0]} ${res.status}: ${body.slice(0, 300)}`,
    );
    (err as Error & { status?: number; code?: string }).status = res.status;
    try {
      (err as Error & { code?: string }).code = JSON.parse(body).code;
    } catch {
      // not JSON
    }
    throw err;
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** PostgREST filter value escaping for eq./in. filters. */
export const q = (v: string) => encodeURIComponent(v);

export const db = {
  select: <T>(table: string, query: string) => call<T[]>(`/${table}?${query}`),
  insert: <T>(table: string, rows: object | object[], select = '*') =>
    call<T[]>(`/${table}?select=${encodeURIComponent(select)}`, {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'return=representation',
    }),
  update: <T>(table: string, filter: string, patch: object, select = '*') =>
    call<T[]>(`/${table}?${filter}&select=${encodeURIComponent(select)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      prefer: 'return=representation',
    }),
  remove: (table: string, filter: string) =>
    call<void>(`/${table}?${filter}`, { method: 'DELETE' }),
  upsert: <T>(table: string, rows: object[], onConflict: string) =>
    call<T[]>(`/${table}?on_conflict=${onConflict}`, {
      method: 'POST',
      body: JSON.stringify(rows),
      prefer: 'resolution=ignore-duplicates,return=representation',
    }),
  rpc: <T>(fn: string, args: object = {}) =>
    call<T>(`/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
};

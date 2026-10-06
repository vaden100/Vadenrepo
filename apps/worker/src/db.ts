import { serviceRoleKey, type WorkerConfig } from './config.js';

/** Service-role PostgREST client. */
export function createDb(config: WorkerConfig) {
  const base = `${(config.supabaseUrl ?? '').replace(/\/$/, '')}/rest/v1`;
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const key = serviceRoleKey();
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        apikey: key,
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
        ...init.headers,
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok)
      throw new Error(
        `db ${init.method ?? 'GET'} ${path.split('?')[0]} ${res.status}: ${(await res.text()).slice(0, 200)}`,
      );
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  return {
    rpc: <T>(fn: string, args: object = {}) =>
      call<T>(`/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }),
    select: <T>(table: string, query: string) => call<T[]>(`/${table}?${query}`),
    update: <T>(table: string, filter: string, patch: object) =>
      call<T[]>(`/${table}?${filter}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  };
}
export type Db = ReturnType<typeof createDb>;

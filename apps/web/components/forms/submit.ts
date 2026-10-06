'use client';

import type { ApiError } from '@rmmm/api';
import { en } from '@rmmm/ui';

export type SubmitResult<T> =
  | { ok: true; data: T }
  | { ok: false; kind: 'invalid'; fields: Record<string, string>; message: string }
  | {
      ok: false;
      kind: 'network' | 'server' | 'rate_limited' | 'conflict' | 'unauthorized' | 'not_found';
      message: string;
    };

/**
 * POST JSON to our API and map every outcome to something a person can act on (WBS 17, 147, 149).
 * Never reports success unless the server said so.
 */
export function postJson<T>(url: string, body: unknown, timeoutMs = 15_000) {
  return requestJson<T>('POST', url, body, timeoutMs);
}

export async function requestJson<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
  timeoutMs = 15_000,
): Promise<SubmitResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    return { ok: false, kind: 'network', message: en.forms.networkError };
  }
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // fall through with null body
  }
  if (res.ok) return { ok: true, data: data as T };
  const e = (data ?? {}) as Partial<ApiError>;
  if (res.status === 422 || (res.status === 400 && e.fields)) {
    return { ok: false, kind: 'invalid', fields: e.fields ?? {}, message: e.message ?? '' };
  }
  if (res.status === 429) return { ok: false, kind: 'rate_limited', message: en.forms.rateLimited };
  if (res.status === 409) return { ok: false, kind: 'conflict', message: e.message ?? '' };
  if (res.status === 401) return { ok: false, kind: 'unauthorized', message: e.message ?? '' };
  if (res.status === 404) return { ok: false, kind: 'not_found', message: e.message ?? '' };
  return { ok: false, kind: 'server', message: e.message ?? en.forms.serverError };
}

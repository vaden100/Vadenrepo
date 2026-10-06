import { NextResponse, type NextRequest } from 'next/server';
import type { ApiError } from '@rmmm/api';
import { log } from './log';

export const json = <T>(body: T, status = 200, headers?: Record<string, string>) =>
  NextResponse.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } });

export const apiError = (
  status: number,
  error: ApiError['error'],
  message: string,
  fields?: Record<string, string>,
) => json<ApiError>({ error, message, ...(fields ? { fields } : {}) }, status);

/**
 * CSRF defense for mutating routes (WBS 34): browsers send Origin and Sec-Fetch-Site on POST.
 * Cross-site requests are refused; session cookies are SameSite=Lax as a second layer.
 */
export function sameOrigin(req: NextRequest): boolean {
  if (req.headers.get('sec-fetch-site') === 'cross-site') return false;
  const origin = req.headers.get('origin');
  if (!origin) return true; // non-browser clients (mobile app, curl); authz still applies
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Reads a JSON body with a hard size cap. Returns undefined when missing/oversized/invalid. */
export async function readJson(req: NextRequest, maxBytes = 16_384): Promise<unknown> {
  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > maxBytes) return undefined;
  try {
    const text = await req.text();
    if (text.length > maxBytes) return undefined;
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function requestId(req: NextRequest) {
  return req.headers.get('x-request-id') ?? undefined;
}

/** Wraps a handler: anything thrown becomes a logged 500 with no internals in the response. */
export function handler(name: string, fn: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    try {
      return await fn(req);
    } catch (err) {
      log('error', `${name}.failed`, {
        requestId: requestId(req),
        err: err instanceof Error ? err.message : String(err),
      });
      return apiError(500, 'server_error', 'Something went wrong on our side. Try again.');
    }
  };
}

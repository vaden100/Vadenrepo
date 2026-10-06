import { NextResponse, type NextRequest } from 'next/server';
import { en } from '@rmmm/ui';
import type { BanStore } from './bans';
import { clientIp, DEVICE_COOKIE, DEVICE_HEADER, deviceHash } from './client';
import {
  buildCsp,
  createNonce,
  PRIVATE_PATHS,
  staticSecurityHeaders,
  type CspOptions,
} from './headers';
import { ruleFor, type RateLimiter, type RateRule } from './rate-limit';

export interface SecurityDeps {
  bans: BanStore | null;
  limiter: RateLimiter | null;
  clientIpHeader: string;
  rules?: readonly RateRule[];
  log?: (msg: string, err?: unknown) => void;
  /** CSP inputs other than the nonce (generated per request). Omit to skip CSP (unit tests). */
  csp?: Omit<CspOptions, 'nonce'>;
  dev?: boolean;
  /** Runs after the checks pass (session refresh). Returns the response to send. */
  next?: (req: NextRequest, res: NextResponse) => Promise<NextResponse>;
}

const isApi = (p: string) => p.startsWith('/api/');

function withHeaders<T extends NextResponse>(res: T, h: Record<string, string>): T {
  for (const [k, v] of Object.entries(h)) res.headers.set(k, v);
  return res;
}

function deny(req: NextRequest, status: 403 | 429, retryAfter?: number) {
  const body = status === 403 ? en.security.blocked : en.security.slowDown;
  const headers: Record<string, string> = { 'cache-control': 'no-store' };
  if (retryAfter !== undefined) headers['retry-after'] = String(Math.max(1, retryAfter));
  return isApi(req.nextUrl.pathname)
    ? NextResponse.json(
        { error: status === 403 ? 'forbidden' : 'rate_limited', message: body },
        { status, headers },
      )
    : new NextResponse(body, {
        status,
        headers: { ...headers, 'content-type': 'text/plain; charset=utf-8' },
      });
}

/**
 * SPEC 9 middleware order: IP ban check (CIDR), device ban check, rate limiter, then auth.
 * Lookups that fail open (log and continue): an outage must not take the site down,
 * and every write is checked again in Postgres (RLS + request_is_banned()).
 */
export function createSecurityProxy(deps: SecurityDeps) {
  const log = deps.log ?? ((m, e) => console.error(`[security] ${m}`, e ?? ''));

  const baseHeaders = staticSecurityHeaders(deps.dev ?? false);

  return async function securityProxy(req: NextRequest): Promise<NextResponse> {
    const requestId = req.headers.get('x-request-id')?.slice(0, 64) || crypto.randomUUID();
    const common = { ...baseHeaders, 'x-request-id': requestId };
    const ip = clientIp(req.headers, deps.clientIpHeader);
    const appDevice = req.headers.get(DEVICE_HEADER);
    let webDevice = req.cookies.get(DEVICE_COOKIE)?.value ?? null;
    const newWebDevice = !appDevice && !webDevice ? crypto.randomUUID() : null;
    webDevice ??= newWebDevice;
    const device = appDevice
      ? await deviceHash('app', appDevice)
      : await deviceHash('web', webDevice);

    if (deps.bans) {
      try {
        if (await deps.bans.isBanned(ip, device)) return withHeaders(deny(req, 403), common);
      } catch (err) {
        log('ban check failed (failing open)', err);
      }
    }

    const rule = ruleFor(req.nextUrl.pathname, req.method, deps.rules);
    let remaining: number | undefined;
    if (rule && deps.limiter && ip) {
      try {
        const d = await deps.limiter.take(`${rule.name}:${ip}`, rule);
        if (!d.allowed) return withHeaders(deny(req, 429, d.retryAfterSeconds), common);
        remaining = d.remaining;
      } catch (err) {
        log('rate limit check failed (failing open)', err);
      }
    }

    // Request headers seen by the app: request id, and the CSP so Next.js applies the nonce
    // to its own scripts (it reads the nonce from the request's CSP header).
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-request-id', requestId);
    requestHeaders.set('x-pathname', req.nextUrl.pathname.slice(0, 300));
    let csp: string | null = null;
    if (deps.csp) {
      const nonce = createNonce();
      csp = buildCsp({ ...deps.csp, nonce });
      requestHeaders.set('x-nonce', nonce);
      requestHeaders.set('content-security-policy', csp);
    }

    let res = NextResponse.next({ request: { headers: requestHeaders } });
    if (deps.next) res = await deps.next(req, res);
    withHeaders(res, common);
    if (csp) res.headers.set('content-security-policy', csp);
    if (PRIVATE_PATHS.test(req.nextUrl.pathname))
      res.headers.set('cache-control', 'private, no-store');
    if (remaining !== undefined) res.headers.set('x-ratelimit-remaining', String(remaining));
    if (newWebDevice) {
      res.cookies.set(DEVICE_COOKIE, newWebDevice, {
        httpOnly: true,
        secure: req.nextUrl.protocol === 'https:',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  };
}

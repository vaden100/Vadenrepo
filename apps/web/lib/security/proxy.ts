import { NextResponse, type NextRequest } from 'next/server';
import { en } from '@rmmm/ui';
import type { BanStore } from './bans';
import { clientIp, DEVICE_COOKIE, DEVICE_HEADER, deviceHash } from './client';
import { ruleFor, type RateLimiter, type RateRule } from './rate-limit';

export interface SecurityDeps {
  bans: BanStore | null;
  limiter: RateLimiter | null;
  clientIpHeader: string;
  rules?: readonly RateRule[];
  log?: (msg: string, err?: unknown) => void;
  /** Runs after the checks pass (session refresh). Returns the response to send. */
  next?: (req: NextRequest, res: NextResponse) => Promise<NextResponse>;
}

const isApi = (p: string) => p.startsWith('/api/');

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

  return async function securityProxy(req: NextRequest): Promise<NextResponse> {
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
        if (await deps.bans.isBanned(ip, device)) return deny(req, 403);
      } catch (err) {
        log('ban check failed (failing open)', err);
      }
    }

    const rule = ruleFor(req.nextUrl.pathname, req.method, deps.rules);
    let remaining: number | undefined;
    if (rule && deps.limiter && ip) {
      try {
        const d = await deps.limiter.take(`${rule.name}:${ip}`, rule);
        if (!d.allowed) return deny(req, 429, d.retryAfterSeconds);
        remaining = d.remaining;
      } catch (err) {
        log('rate limit check failed (failing open)', err);
      }
    }

    let res = NextResponse.next();
    if (deps.next) res = await deps.next(req, res);
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

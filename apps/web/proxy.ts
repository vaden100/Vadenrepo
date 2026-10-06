import type { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';
import { SupabaseBanStore } from '@/lib/security/bans';
import { createSecurityProxy } from '@/lib/security/proxy';
import { MemoryRateLimiter, SupabaseRateLimiter } from '@/lib/security/rate-limit';
import { refreshSession } from '@/lib/supabase/middleware';

// No matcher: the ban check runs on every route, static files included (SPEC 11).
let handler: ReturnType<typeof createSecurityProxy> | null = null;

function build() {
  const env = serverEnv();
  const db =
    env.supabaseUrl && env.serviceRoleKey
      ? { url: env.supabaseUrl, key: env.serviceRoleKey }
      : null;
  if (!db && process.env.NODE_ENV === 'production') {
    console.error(
      '[security] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing: ban checks are OFF',
    );
  }
  return createSecurityProxy({
    bans: db ? new SupabaseBanStore(db.url, db.key, env.banCacheTtlMs) : null,
    limiter: db ? new SupabaseRateLimiter(db.url, db.key) : new MemoryRateLimiter(),
    clientIpHeader: env.clientIpHeader,
    dev: process.env.NODE_ENV !== 'production',
    csp: {
      dev: process.env.NODE_ENV !== 'production',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      turnstile: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
      analyticsHost: process.env.NEXT_PUBLIC_ANALYTICS_HOST || undefined,
    },
    next: async (req, res) => {
      const isPage =
        !req.nextUrl.pathname.startsWith('/_next/') && !req.nextUrl.pathname.includes('.');
      if (isPage && env.supabaseUrl && env.supabaseAnonKey) {
        return refreshSession(req, res, env.supabaseUrl, env.supabaseAnonKey);
      }
      return res;
    },
  });
}

export async function proxy(req: NextRequest) {
  handler ??= build();
  return handler(req);
}

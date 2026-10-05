/**
 * Server-side env. The service role key is read here and nowhere near client code
 * (SPEC 11). Values are read lazily so `next build` works without secrets.
 */
export interface ServerEnv {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  serviceRoleKey: string | undefined;
  /** Header that carries the real client IP. Vercel sets x-forwarded-for and strips client values. */
  clientIpHeader: string;
  /** How long a ban lookup is cached per IP/device. 0 disables caching. */
  banCacheTtlMs: number;
  turnstileSiteKey: string | undefined;
}

export function serverEnv(env: NodeJS.ProcessEnv = process.env): ServerEnv {
  return {
    supabaseUrl: env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || undefined,
    supabaseAnonKey: env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || undefined,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    clientIpHeader: (env.CLIENT_IP_HEADER || 'x-forwarded-for').toLowerCase(),
    banCacheTtlMs: env.BAN_CACHE_TTL_MS ? Number(env.BAN_CACHE_TTL_MS) : 5_000,
    turnstileSiteKey: env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || undefined,
  };
}

/** Values safe for the browser (inlined by Next at build time). */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
};

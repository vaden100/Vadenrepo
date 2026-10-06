import type { NextRequest } from 'next/server';
import { serverEnv } from '@/lib/env';
import { getSession } from '@/lib/session';
import { db, q } from './db';

export interface Caller {
  userId: string;
  name: string | null;
  /** 18+ confirmed and current terms accepted. */
  onboarded: boolean;
}

interface ProfileRow {
  display_name: string | null;
  age_confirmed_at: string | null;
  terms_accepted_at: string | null;
}

/**
 * Who is signed in: the web session cookie, or for the mobile app a Supabase access token
 * in `Authorization: Bearer`. The token is checked by Supabase Auth, never decoded here.
 */
export async function caller(req: NextRequest): Promise<Caller | null> {
  const bearer = req.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!bearer) {
    const s = await getSession();
    if (!s) return null;
    const p = s.profile;
    return {
      userId: s.user.id,
      name: p?.display_name ?? null,
      onboarded: Boolean(p?.age_confirmed_at && p.terms_accepted_at),
    };
  }
  const { supabaseUrl, supabaseAnonKey } = serverEnv();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { apikey: supabaseAnonKey, authorization: `Bearer ${bearer}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!res?.ok) return null;
  const user = (await res.json()) as { id?: string };
  if (!user.id || !/^[0-9a-f-]{36}$/.test(user.id)) return null;
  const [p] = await db.select<ProfileRow>(
    'profiles',
    `id=eq.${q(user.id)}&select=display_name,age_confirmed_at,terms_accepted_at`,
  );
  return {
    userId: user.id,
    name: p?.display_name ?? null,
    onboarded: Boolean(p?.age_confirmed_at && p?.terms_accepted_at),
  };
}

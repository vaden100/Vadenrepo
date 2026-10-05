import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';

export interface Profile {
  id: string;
  role: string;
  display_name: string | null;
  age_confirmed_at: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
}

/** Current user + profile, or null. Never throws for signed-out visitors. */
export async function getSession() {
  const supabase = await supabaseServer();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single<Profile>();
  return { user: data.user, profile };
}

/** Signed in AND onboarded (18+, current terms), or redirect. */
export async function requireMember(from: string) {
  const session = await getSession();
  if (!session) redirect(`/auth?next=${encodeURIComponent(from)}`);
  const p = session.profile;
  if (!p?.age_confirmed_at || !p.terms_accepted_at)
    redirect(`/onboarding?next=${encodeURIComponent(from)}`);
  return session;
}

/** Only allow same-site relative redirects. */
export function safeNext(next: string | string[] | undefined, fallback = '/account'): string {
  const v = Array.isArray(next) ? next[0] : next;
  return v && v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\') ? v : fallback;
}

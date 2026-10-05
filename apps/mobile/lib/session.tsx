import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface Profile {
  id: string;
  role: string;
  age_confirmed_at: string | null;
  terms_accepted_at: string | null;
  created_at: string;
}

interface SessionState {
  ready: boolean;
  session: Session | null;
  profile: Profile | null;
  onboarded: boolean;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<SessionState>({
  ready: false,
  session: null,
  profile: null,
  onboarded: false,
  refreshProfile: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  // Without Supabase env there is nothing to load.
  const [ready, setReady] = useState(() => supabase() === null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (s: Session | null) => {
    const sb = supabase();
    if (!sb || !s) return setProfile(null);
    const { data } = await sb.from('profiles').select('*').eq('id', s.user.id).single<Profile>();
    setProfile(data ?? null);
  }, []);

  useEffect(() => {
    const sb = supabase();
    if (!sb) return;
    sb.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await loadProfile(data.session);
      setReady(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      void loadProfile(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const value: SessionState = {
    ready,
    session,
    profile,
    onboarded: !!profile?.age_confirmed_at && !!profile.terms_accepted_at,
    refreshProfile: () => loadProfile(session),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);

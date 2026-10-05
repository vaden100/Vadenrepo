import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { serverEnv } from '@/lib/env';

/** Supabase client for server components and route handlers, acting as the signed-in user. */
export async function supabaseServer() {
  const { supabaseUrl, supabaseAnonKey } = serverEnv();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const store = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Server components cannot set cookies; the proxy refreshes them instead.
        }
      },
    },
  });
}

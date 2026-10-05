import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import { installId } from './device';
import { secureStorage } from './secureStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Null when the app was built without Supabase env (e.g. CI bundle checks). */
export function supabase(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: {
        storage: secureStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        // Device header so Postgres can refuse writes from banned devices (request_is_banned()).
        fetch: async (input, init) => {
          const headers = new Headers(init?.headers);
          headers.set('x-rmmm-device', await installId());
          return fetch(input, { ...init, headers });
        },
      },
    });
    const c = client;
    AppState.addEventListener('change', (s) => {
      if (s === 'active') c.auth.startAutoRefresh();
      else c.auth.stopAutoRefresh();
    });
  }
  return client;
}

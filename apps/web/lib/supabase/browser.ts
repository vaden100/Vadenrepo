'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '@/lib/env';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowser() {
  if (!publicEnv.supabaseUrl || !publicEnv.supabaseAnonKey) return null;
  client ??= createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
  return client;
}

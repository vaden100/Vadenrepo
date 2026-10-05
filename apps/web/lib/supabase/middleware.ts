import { createServerClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

/** Refreshes the Supabase session cookie on page requests (standard @supabase/ssr pattern). */
export async function refreshSession(
  req: NextRequest,
  res: NextResponse,
  url: string,
  anonKey: string,
): Promise<NextResponse> {
  if (!req.cookies.getAll().some((c) => c.name.startsWith('sb-'))) return res;
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookies) => {
        for (const { name, value, options } of cookies) res.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return res;
}

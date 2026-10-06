'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { requestJson } from '@/components/forms/submit';

/** Calls an /api/admin route, shows the server's message on failure, refreshes on success. */
export function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function run<T>(
    method: 'POST' | 'PATCH' | 'DELETE',
    url: string,
    body?: unknown,
    okMessage?: string,
  ): Promise<T | null> {
    if (busy) return null;
    setBusy(true);
    setError(null);
    setDone(null);
    const r = await requestJson<T>(method, url, body);
    setBusy(false);
    if (!r.ok) {
      setError(r.message || 'That did not work. Try again.');
      return null;
    }
    if (okMessage) setDone(okMessage);
    router.refresh();
    return r.data;
  }
  return { run, busy, error, done, setError };
}

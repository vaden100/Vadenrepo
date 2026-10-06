'use client';

import { track } from './analytics';

/** Saves privacy choices through the server (which sets the cookie and logs the decision). */
export async function saveConsent(analytics: boolean): Promise<boolean> {
  try {
    const res = await fetch('/api/consent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ analytics }),
    });
    if (res.ok) track('consent_saved', { analytics });
    return res.ok;
  } catch {
    return false;
  }
}

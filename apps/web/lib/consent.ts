/**
 * Privacy choices (WBS 31, 101 to 103). Necessary cookies need no consent; everything else
 * is off until the person turns it on. The cookie is the record on the device; signed-in
 * users' choices are also written to consents_log with the policy version.
 */
export const CONSENT_COOKIE = 'rmmm_consent';
/** Bump when the cookie policy changes materially: everyone is asked again. */
export const CONSENT_VERSION = '2026-10-05';

export interface ConsentState {
  version: string;
  analytics: boolean;
  /** Always false: we do not use marketing cookies. Kept so the record is explicit. */
  marketing: false;
  decidedAt: string;
}

export function parseConsent(raw: string | undefined): ConsentState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<ConsentState>;
    if (
      v.version !== CONSENT_VERSION ||
      typeof v.analytics !== 'boolean' ||
      typeof v.decidedAt !== 'string'
    )
      return null;
    return { version: v.version, analytics: v.analytics, marketing: false, decidedAt: v.decidedAt };
  } catch {
    return null;
  }
}

/** Optional categories only matter when something optional is actually configured. */
export const analyticsHost = process.env.NEXT_PUBLIC_ANALYTICS_HOST || '';
export const analyticsDomain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN || '';
export const analyticsConfigured = Boolean(analyticsHost && analyticsDomain);

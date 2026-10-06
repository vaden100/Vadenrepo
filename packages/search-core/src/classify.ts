import {
  handleFromUrl,
  looseHandle,
  normalizeCashtag,
  normalizeDomain,
  normalizeEmail,
  normalizeHandle,
  normalizeName,
  normalizePhone,
  type SocialPlatform,
} from './normalize';

/** SPEC 8.1: what a query looks like. */
export type QueryKind = 'cashtag' | 'handle' | 'phone' | 'email' | 'domain' | 'name';

export interface ClassifiedQuery {
  kind: QueryKind;
  raw: string;
  norm: string;
  /** Handles only: separators and trailing digits removed (nailz2 -> nailz). */
  normLoose?: string;
  /** Handles from a profile URL know their platform. */
  platform?: SocialPlatform;
}

const CASHTAG = /^\$\s*[a-z][a-z0-9_ -]{0,30}$/i;
const HANDLE = /^@[a-z0-9._]{1,40}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS = /\d/g;
const URLISH = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(:\d+)?(\/\S*)?$/i;

/** Classifies anything typed into the Lookup bar. Never throws; empty input returns null. */
export function classify(input: string): ClassifiedQuery | null {
  const raw = input.trim();
  if (!raw) return null;

  if (CASHTAG.test(raw)) {
    const norm = normalizeCashtag(raw);
    if (norm) return { kind: 'cashtag', raw, norm };
  }

  const social = handleFromUrl(raw);
  if (social || HANDLE.test(raw)) {
    const norm = normalizeHandle(raw);
    if (norm)
      return {
        kind: 'handle',
        raw,
        norm,
        normLoose: looseHandle(norm),
        platform: social?.platform,
      };
  }

  if (EMAIL.test(raw)) return { kind: 'email', raw, norm: normalizeEmail(raw) };

  if ((raw.match(DIGITS)?.length ?? 0) >= 10 && /^[+\d\s().-]+$/.test(raw)) {
    const phone = normalizePhone(raw);
    if (phone) return { kind: 'phone', raw, norm: phone };
  }

  if (URLISH.test(raw)) {
    const domain = normalizeDomain(raw);
    if (domain) return { kind: 'domain', raw, norm: domain };
  }

  const name = normalizeName(raw);
  return name ? { kind: 'name', raw, norm: name } : null;
}

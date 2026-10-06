import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { getDomain } from 'tldts';

/**
 * Normalizers from SPEC 8.1. Pure functions shared by web, mobile, edge functions and
 * DB fixture tests, so the same input always becomes the same `norm`.
 */

/** "$Tee Laces" -> "teelaces" */
export function normalizeCashtag(input: string): string {
  return input.trim().replace(/^\$+/, '').replace(/\s+/g, '').toLowerCase();
}

const SOCIAL_HOSTS =
  /^(?:www\.|m\.|mobile\.)?(instagram\.com|instagr\.am|tiktok\.com|facebook\.com|fb\.com|x\.com|twitter\.com)$/i;

export type SocialPlatform = 'ig' | 'tiktok' | 'fb' | 'x';

function platformFor(host: string): SocialPlatform | undefined {
  const h = host.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, '');
  if (h === 'instagram.com' || h === 'instagr.am') return 'ig';
  if (h === 'tiktok.com') return 'tiktok';
  if (h === 'facebook.com' || h === 'fb.com') return 'fb';
  if (h === 'x.com' || h === 'twitter.com') return 'x';
  return undefined;
}

/** Pulls the handle out of an IG/TikTok/FB/X profile URL, or returns null. */
export function handleFromUrl(input: string): { handle: string; platform: SocialPlatform } | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  } catch {
    return null;
  }
  if (!SOCIAL_HOSTS.test(url.hostname)) return null;
  const platform = platformFor(url.hostname);
  const first = url.pathname.split('/').filter(Boolean)[0];
  if (!platform || !first) return null;
  const handle = decodeURIComponent(first).replace(/^@/, '');
  if (
    !handle ||
    ['p', 'reel', 'reels', 'stories', 'explore', 'share', 'watch', 'profile.php'].includes(
      handle.toLowerCase(),
    )
  ) {
    return null;
  }
  return { handle, platform };
}

/** "@Laced.By.Tee_" -> "laced.by.tee" (strip @, URL parts, trailing . and _) */
export function normalizeHandle(input: string): string {
  const fromUrl = handleFromUrl(input);
  const raw = fromUrl ? fromUrl.handle : input.trim();
  return raw
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[._]+$/, '');
}

/** Loose form for rebrand matching: drop separators and trailing digits ("nailz2" -> "nailz"). */
export function looseHandle(norm: string): string {
  return norm.replace(/[._-]+/g, '').replace(/\d+$/, '');
}

/** E.164, US by default. Returns null when it is not a valid number. */
export function normalizePhone(input: string, defaultCountry: 'US' = 'US'): string | null {
  const p = parsePhoneNumberFromString(input.trim(), defaultCountry);
  return p?.isValid() ? p.number : null;
}

const GMAIL = new Set(['gmail.com', 'googlemail.com']);

/** Lowercase + trim; Gmail ignores dots and +tags in the local part. */
export function normalizeEmail(input: string): string {
  const v = input.trim().toLowerCase();
  const at = v.lastIndexOf('@');
  if (at < 1) return v;
  let local = v.slice(0, at);
  let domain = v.slice(at + 1);
  if (GMAIL.has(domain)) {
    local = local.split('+')[0]!.replace(/\./g, '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

/** Registrable domain ("https://www.Shop.Nailz.co.uk/x" -> "nailz.co.uk"). */
export function normalizeDomain(input: string): string | null {
  const v = input.trim().toLowerCase();
  const host = (() => {
    try {
      return new URL(/^[a-z][a-z0-9+.-]*:\/\//.test(v) ? v : `https://${v}`).hostname;
    } catch {
      return null;
    }
  })();
  if (!host) return null;
  const d = getDomain(host.replace(/^www\./, ''), { allowPrivateDomains: true });
  return d ?? null;
}

const NAME_STOPWORDS = /\b(llc|l\.l\.c|inc|incorporated|co|company|studio|studios|by|the)\b/g;

/** Business name: unaccent, lowercase, strip emoji/punctuation and filler words, collapse spaces. */
export function normalizeName(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️/gu, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(NAME_STOPWORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

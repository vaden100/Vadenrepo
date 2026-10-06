import {
  looseHandle,
  normalizeCashtag,
  normalizeDomain,
  normalizeEmail,
  normalizeHandle,
  normalizePhone,
} from './normalize';

/**
 * Pulls identifiers and money amounts out of free text: OCR from screenshots and flyers,
 * voice-note transcripts, stories (SPEC 8.3). Output is normalized and de-duplicated.
 */
export interface ExtractedIdentifiers {
  cashtags: string[];
  handles: { norm: string; loose: string }[];
  phones: string[];
  emails: string[];
  domains: string[];
  /** Amounts in cents, e.g. "$50 deposit" -> 5000. */
  amounts: number[];
}

const CASHTAG = /(?:^|[\s(,:;])\$([A-Za-z][A-Za-z0-9_]{0,19})\b/g;
const HANDLE = /(?:^|[\s(,:;])@([A-Za-z0-9._]{2,30})(?![A-Za-z0-9._]*@)/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const URL_LIKE =
  /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|co|io|me|biz|info|shop|store|site|online|us|ee|link|app|ly|gg|tv)(?:\/[^\s]*)?/gi;
const AMOUNT = /\$\s?(\d{1,3}(?:,\d{3})+|\d{1,7})(?:\.(\d{2}))?(?!\w)/g;

const uniq = <T>(xs: T[], key: (x: T) => string = String) => {
  const seen = new Set<string>();
  return xs.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

export function extractIdentifiers(text: string): ExtractedIdentifiers {
  const t = text.slice(0, 50_000);
  const emails = uniq([...t.matchAll(EMAIL)].map((m) => normalizeEmail(m[0])));
  const withoutEmails = t.replace(EMAIL, ' ');

  const cashtags = uniq(
    [...withoutEmails.matchAll(CASHTAG)]
      .map((m) => m[1]!)
      .filter((v) => !/^\d/.test(v))
      .map((v) => normalizeCashtag(v)),
  );
  const handles = uniq(
    [...withoutEmails.matchAll(HANDLE)].map((m) => {
      const norm = normalizeHandle(`@${m[1]}`);
      return { norm, loose: looseHandle(norm) };
    }),
    (h) => h.norm,
  ).filter((h) => h.norm.length >= 2);
  const phones = uniq(
    [...withoutEmails.matchAll(PHONE)]
      .map((m) => normalizePhone(m[0]))
      .filter((p): p is string => Boolean(p)),
  );
  const domains = uniq(
    [...withoutEmails.matchAll(URL_LIKE)]
      .map((m) => normalizeDomain(m[0]))
      .filter(
        (d): d is string =>
          Boolean(d) && !/^(instagram|tiktok|facebook|twitter|x|cash)\.(com|app)$/.test(d!),
      ),
  );
  const amounts = uniq(
    [...t.matchAll(AMOUNT)].map((m) => Number(m[1]!.replace(/,/g, '')) * 100 + Number(m[2] ?? 0)),
    String,
  ).filter((c) => c > 0);
  return { cashtags, handles, phones, emails, domains, amounts };
}

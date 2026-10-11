import type { SearchHit, SearchLink } from '@rmmm/api';
import { en, type LinkedPage } from '@rmmm/ui/web';

type Reason = keyof Omit<typeof en.whyMatched, 'title'>;
const known = (r: string): r is Reason => r in en.whyMatched && r !== 'title';

/** Strongest reasons first: same tag/phone beat similar names. */
const ORDER = [
  'same_cashtag',
  'same_phone',
  'same_payment',
  'same_email',
  'same_website',
  'same_handle',
  'same_name',
  'possible_rebrand',
  'similar_handle',
  'similar_name',
  'story_match',
];

export function reasonChips(hit: SearchHit) {
  return [...hit.reasons]
    .filter(known)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .map((reason, i) => ({ reason, strongest: i === 0 && reason.startsWith('same_') }));
}

export function linkedPages(links: SearchLink[]): LinkedPage[] {
  return links.map((l) => ({
    label: l.name,
    href: `/entities/${l.slug}`,
    reason: known(l.reason) ? l.reason : 'staff_manual',
  }));
}

export const place = (city: string | null, state: string | null) =>
  [city, state].filter(Boolean).join(', ');

export function categoryLabel(c: string | null): string | undefined {
  if (!c) return undefined;
  return (en.report.category.options as Record<string, string>)[c]?.toLowerCase();
}

/** Official places to check for categories where a regulator keeps a list (docs/open-data-sources.md). */
export function officialChecks(categories: (string | null)[]) {
  const out: { href: string; label: string }[] = [];
  if (categories.includes('forex_trading'))
    out.push({
      href: 'https://www.cftc.gov/LearnAndProtect/Resources/Check/redlist.htm',
      label: en.lookup.cftcRedList,
    });
  if (categories.includes('credit_repair'))
    out.push({
      href: 'https://www.consumerfinance.gov/data-research/consumer-complaints/',
      label: en.lookup.cfpbComplaints,
    });
  return out;
}

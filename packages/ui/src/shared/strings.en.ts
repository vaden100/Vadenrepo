/**
 * UI strings (EN). Every user-facing string in @rmmm/ui lives here so it can be translated.
 * Copy rules (SPEC 14): plain, kind, neutral about named parties. No em dashes, no emojis,
 * never "scammer" or "fraud" as a statement of fact.
 */
export const en = {
  stamp: {
    reported: 'Reported',
    verifying: 'Verifying',
    contacted: 'Contacted',
    response_received: 'Response received',
    no_response: 'No response',
    resolved_refunded: 'Resolved: refunded',
    resolved_other: 'Resolved',
    closed: 'Closed',
    alleged: 'Alleged',
    verified: 'Verified',
    no_refunds: 'No refunds',
  },
  evidence: {
    reported: (n: number) => `Reported ${n} ${n === 1 ? 'time' : 'times'}`,
    reviewed: (n: number) => `${n} reviewed`,
    lost: (amount: string) => `${amount} reported lost`,
    lastReport: (ago: string) => `Last report ${ago}`,
    linkedPages: (n: number) => `Linked pages: ${n}`,
    underReviewTitle: 'Reports under review',
    underReviewBody:
      'Something matched, but it has not been reviewed yet. Nothing is shown until a person checks the receipts.',
    noResultsTitle: 'No reports yet.',
    noResultsBody: "That's not a guarantee.",
  },
  whyMatched: {
    title: 'Why this matched',
    shared_cashtag: 'Same Cash App tag',
    shared_phone: 'Same phone',
    shared_payment: 'Same payment account',
    same_flyer_phash: 'Same flyer image',
    name_similarity: 'Name similar to',
    loose_handle: 'Similar handle',
    exact_handle: 'Same handle',
    staff_manual: 'Linked by our team',
  },
  linkedPages: {
    title: 'Linked pages',
    empty: 'No linked pages.',
  },
  envelope: {
    emptyTitle: 'No case yet',
    emptyBody: 'Cases show up here once our team opens one.',
    caseNumber: 'Case number',
  },
  receipt: {
    paid: 'Paid',
    rail: 'Paid with',
    date: 'Date',
  },
  common: {
    loading: 'Loading',
    alleged: 'Alleged',
  },
  time: {
    today: 'today',
    yesterday: 'yesterday',
    daysAgo: (n: number) => `${n} days ago`,
    weeksAgo: (n: number) => `${n} ${n === 1 ? 'week' : 'weeks'} ago`,
    monthsAgo: (n: number) => `${n} ${n === 1 ? 'month' : 'months'} ago`,
    yearsAgo: (n: number) => `${n} ${n === 1 ? 'year' : 'years'} ago`,
  },
} as const;

export type Strings = typeof en;

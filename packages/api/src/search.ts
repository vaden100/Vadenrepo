/** SPEC 8.2 / 9: what /api/search returns. Public entities only; never a score shown as one. */

export interface SearchSummary {
  reports: number;
  reviewed: number;
  amountCents: number;
  lastReportAt: string | null;
  categories: Record<string, number>;
}

export interface SearchLink {
  slug: string;
  name: string;
  reason:
    'shared_cashtag' | 'shared_phone' | 'same_flyer_phash' | 'name_similarity' | 'staff_manual';
  confidence: number;
  evidence: { type?: string; value?: string } | null;
}

export interface SearchHit {
  slug: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  /** Ranking only. Never shown to people as a score (SPEC 4.2). */
  score: number;
  reasons: string[];
  summary: SearchSummary;
  links: SearchLink[];
}

/** A public list kept by someone else that includes this website (docs/open-data-sources.md). */
export interface OutsideRecord {
  source: string;
  label: string;
  url: string;
  license: string;
  falsePositiveUrl: string | null;
  value: string;
  listUpdatedAt: string | null;
}

export interface SearchResponse {
  query: { kind: string; display: string } | null;
  results: SearchHit[];
  /** Something matched an entity that is not public yet. No details are given. */
  underReview: boolean;
  /** Outside lists that include the website searched for. Neutral facts, never part of ranking. */
  outside: OutsideRecord[];
}

export interface FlyerHit {
  slug: string;
  name: string;
  city: string | null;
  state: string | null;
  matchingReports: number;
  distance: number;
}

export interface FlyerResponse {
  results: FlyerHit[];
  underReview: boolean;
}

export const SEARCH_MAX_LENGTH = 200;
export const FLYER_MAX_BYTES = 15 * 1024 * 1024;

/** GET entity_page(slug): public data only, identifiers already masked by Postgres. */
export interface EntityPageData {
  slug: string;
  name: string;
  category: string | null;
  city: string | null;
  state: string | null;
  approvedAt: string | null;
  reply: { text: string; updatedAt: string } | null;
  summary: SearchSummary;
  identifiers: { type: string; display: string }[];
  links: SearchLink[];
  excerpts: {
    category: string | null;
    amountRange: string | null;
    month: string | null;
    city: string | null;
    state: string | null;
    excerpt: string;
  }[];
}

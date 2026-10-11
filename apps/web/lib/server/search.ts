import { SEARCH_MAX_LENGTH, type OutsideRecord, type SearchResponse } from '@rmmm/api';
import { classify } from '@rmmm/search-core';
import { db } from './db';

const display = (kind: string, norm: string) =>
  kind === 'cashtag' ? `$${norm}` : kind === 'handle' ? `@${norm}` : norm;

/** The exact host typed (lists are per host: login-x.weeblysite.com, not weeblysite.com). */
export function hostOf(input: string): string | null {
  const v = input.trim();
  if (!v || /\s/.test(v)) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`).hostname.toLowerCase();
    return host.includes('.') ? host.replace(/^www\./, '') : null;
  } catch {
    return null;
  }
}

/**
 * SPEC 8.2: classify and normalize here (search-core), plan in Postgres (search_everything).
 * Runs with the service role, which Postgres treats as the public: only public entities, and
 * "under review" with no details for anything else. Websites are also checked against outside
 * lists (docs/open-data-sources.md), shown separately and never used for ranking.
 */
export async function searchEverything(input: string): Promise<SearchResponse> {
  const c = classify(input.slice(0, SEARCH_MAX_LENGTH));
  if (!c) return { query: null, results: [], underReview: false, outside: [] };
  const [r, outside] = await Promise.all([
    db.rpc<Pick<SearchResponse, 'results' | 'underReview'>>('search_everything', {
      kind: c.kind,
      norm: c.norm,
      loose: c.normLoose ?? null,
      raw: c.kind === 'name' ? input.trim().slice(0, SEARCH_MAX_LENGTH) : null,
    }),
    c.kind === 'domain'
      ? db
          .rpc<OutsideRecord[]>('outside_lookup', {
            hosts: [...new Set([hostOf(input), c.norm].filter(Boolean))],
          })
          .catch(() => [] as OutsideRecord[])
      : Promise.resolve([] as OutsideRecord[]),
  ]);
  return {
    query: { kind: c.kind, display: display(c.kind, c.norm) },
    results: r.results,
    underReview: r.underReview,
    outside,
  };
}

import { SEARCH_MAX_LENGTH, type SearchResponse } from '@rmmm/api';
import { classify } from '@rmmm/search-core';
import { db } from './db';

const display = (kind: string, norm: string) =>
  kind === 'cashtag' ? `$${norm}` : kind === 'handle' ? `@${norm}` : norm;

/**
 * SPEC 8.2: classify and normalize here (search-core), plan in Postgres (search_everything).
 * Runs with the service role, which Postgres treats as the public: only public entities, and
 * "under review" with no details for anything else.
 */
export async function searchEverything(input: string): Promise<SearchResponse> {
  const c = classify(input.slice(0, SEARCH_MAX_LENGTH));
  if (!c) return { query: null, results: [], underReview: false };
  const r = await db.rpc<Omit<SearchResponse, 'query'>>('search_everything', {
    kind: c.kind,
    norm: c.norm,
    loose: c.normLoose ?? null,
    raw: c.kind === 'name' ? input.trim().slice(0, SEARCH_MAX_LENGTH) : null,
  });
  return {
    query: { kind: c.kind, display: display(c.kind, c.norm) },
    results: r.results,
    underReview: r.underReview,
  };
}

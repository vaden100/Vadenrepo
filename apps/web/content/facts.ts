/**
 * Facts about the gallery that pages may show. Each one names its row in docs/facts.md
 * (SPEC 0.3). Status "needs confirmation" means shown on the current site but not yet confirmed
 * by the director. Do not add a fact here without adding it there first.
 */
export interface Fact<T = string> {
  value: T;
  source: string;
  status: 'confirmed' | 'needs confirmation';
}

export const facts = {
  name: {
    value: 'The Nonsocial One Gallery',
    source: 'docs/facts.md#organization (Name)',
    status: 'needs confirmation',
  },
  shortName: {
    value: 'The NS1 Gallery',
    source: 'docs/facts.md#organization (Name)',
    status: 'needs confirmation',
  },
  currentSite: {
    value: 'https://thenonsocialonegallery.square.site',
    source: 'docs/facts.md#organization (Current site)',
    status: 'confirmed',
  },
  sessionSize: {
    value: { min: 10, max: 15 },
    source: 'docs/facts.md#programs-and-offers (S.A.F.E Sessions, size and rhythm)',
    status: 'needs confirmation',
  },
} as const satisfies Record<string, Fact<unknown>>;

/**
 * Facts about the gallery that pages may show. Each one names its row in docs/facts.md
 * (SPEC 0.3). `value: null` means we do not have it yet: pages render a <Placeholder> and the
 * item is listed in docs/placeholders.md. Do not add a fact here without adding it there first.
 */
export interface Fact<T = string> {
  value: T | null;
  source: string;
  status: 'confirmed' | 'needs confirmation' | 'missing';
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
  founded: {
    value: 2022,
    source: 'docs/facts.md#organization (Founded)',
    status: 'needs confirmation',
  },
  tagline: {
    value: 'Nonsocial. Not Antisocial.',
    source: 'docs/facts.md#organization (Tagline)',
    status: 'needs confirmation',
  },
  heroLine: {
    value: 'Home of everything S.A.F.E',
    source: 'docs/facts.md#organization (Hero line)',
    status: 'needs confirmation',
  },
  slogan: {
    value: 'Where Conversation Together Becomes Growth',
    source: 'docs/facts.md#programs-and-offers (Slogan)',
    status: 'needs confirmation',
  },
  /** Their words, verbatim. Never edit (SPEC 1, MISSION). */
  mission: {
    value:
      'The Nonsocial One Gallery created in 2022 to be the accumulation & display of perseverance, creativity, & individuality. The Gallery integrity lies within mental health, collaboration & conflict resolution being involved on both sides of community. From the best to the most unfavorable moments, people, or places. Challenging you to be amongst the madness and conquer it internally',
    source: 'docs/facts.md#mission-their-words-verbatim-not-edited',
    status: 'needs confirmation',
  },
  company: {
    value: 'Stack Over Shine (S.O.S)',
    source: 'docs/facts.md#organization (Company name), director 2026-10-27',
    status: 'confirmed',
  },
  nonprofit: {
    value: true,
    source: 'docs/facts.md#organization (Nonprofit), director 2026-10-27',
    status: 'confirmed',
  },
  legalName: { value: null, source: 'docs/placeholders.md question 1', status: 'missing' },
  ein: { value: null, source: 'docs/placeholders.md question 1', status: 'missing' },
  taxType: { value: null, source: 'docs/placeholders.md question 1', status: 'missing' },
  owner: {
    value: 'DaShawn "Dub" Warfield',
    source: 'docs/facts.md#organization (Owner / creator)',
    status: 'needs confirmation',
  },
  ownerTitle: {
    value: 'Owner/Creator of The NS1 Gallery',
    source: 'docs/facts.md#organization (Owner / creator)',
    status: 'needs confirmation',
  },
  currentSite: {
    value: 'https://thenonsocialonegallery.square.site',
    source: 'docs/facts.md#organization (Current site)',
    status: 'confirmed',
  },
  linktree: {
    value: 'https://linktr.ee/thens1',
    source: 'docs/facts.md#organization (Link hub)',
    status: 'needs confirmation',
  },
  venue: {
    value: {
      name: 'P30',
      street: '3039 North Post Road',
      city: 'Indianapolis',
      region: 'IN',
      postalCode: '46226',
    },
    source: 'docs/facts.md#places',
    status: 'needs confirmation',
  },
  sessionSize: {
    value: { min: 10, max: 15 },
    source: 'docs/facts.md#programs-and-offers (S.A.F.E Sessions, size and rhythm)',
    status: 'needs confirmation',
  },
  sessionsPerMonth: {
    value: 2,
    source: 'docs/facts.md#programs-and-offers (S.A.F.E Sessions, size and rhythm)',
    status: 'needs confirmation',
  },
  nextSession: { value: null, source: 'docs/placeholders.md question 6', status: 'missing' },
  email: { value: null, source: 'docs/placeholders.md question 11', status: 'missing' },
  phone: { value: null, source: 'docs/placeholders.md question 11', status: 'missing' },
  mailingAddress: { value: null, source: 'docs/placeholders.md question 11', status: 'missing' },
} as const satisfies Record<string, Fact<unknown>>;

/** National crisis lines, verified at the official source (docs/facts.md#crisis-resources). */
export const crisis = {
  verified: '2026-10-27',
  lifeline: {
    number: '988',
    chatUrl: 'https://988lifeline.org/',
    source: 'https://988lifeline.org/get-help/',
  },
  emergency: { number: '911' },
} as const;

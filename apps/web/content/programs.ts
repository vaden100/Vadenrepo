/**
 * Programs and offers, in the gallery's own words from the current site (docs/facts.md,
 * Programs and offers). `quote` is verbatim and shown as a quotation. Anything we do not have yet
 * is null and renders as a placeholder.
 */
export interface Program {
  slug: string;
  name: string;
  quote: string;
  /** How to take part, today. */
  join: 'session' | 'contact';
  kind: 'program' | 'offer';
}

export const programs: Program[] = [
  {
    slug: 'safe-sessions',
    name: 'S.A.F.E Sessions',
    quote:
      'Niche roundtable conversations hosted at P30. Using movies, art, music, viral moments, current news for the purpose of cultural awareness, expression and conflict resolution.',
    join: 'session',
    kind: 'program',
  },
  {
    slug: 'book-a-session',
    name: 'Book a S.A.F.E Session',
    quote:
      'Enjoyed a session? Want to personalize it to your Culture featuring Slimeball? Let’s talk hosting, location, subject material, schedule and more…',
    join: 'contact',
    kind: 'offer',
  },
  {
    slug: 'creative-consulting',
    name: 'Creative Consulting',
    quote: 'Let’s sit down and actually talk. Business advice, Q&A sessions, Strategize etc',
    join: 'contact',
    kind: 'offer',
  },
  {
    slug: 'personal-collab',
    name: 'Personal Collab',
    quote: 'Podcasts, Event Hosting, Content etc…Let’s plan!',
    join: 'contact',
    kind: 'offer',
  },
];

/** Extra lines for S.A.F.E Sessions, verbatim from the current site. */
export const safeQuotes = {
  promise: 'Your personal stories, grievances, questions, concerns, jokes etc… are S.A.F.E here',
  extras: 'Meet Special Guests & Enjoy Refreshments',
};

export function programBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

import { strings } from '@ns1/i18n';
import { programs } from './programs';

/**
 * Every public page, once. The sitemap, site search, the e2e suite (axe, overflow, console) and
 * the page titles all read this list, so a new page is added here and nowhere else.
 */
export interface SitePage {
  path: string;
  title: string;
  description: string;
  /** Extra words for site search. */
  keywords?: string;
}

const t = strings();

export const sitePages: SitePage[] = [
  {
    path: '/',
    title: t.home.title,
    description: t.home.description,
    keywords: 'home safe sessions',
  },
  { path: '/programs', title: t.programs.title, description: t.programs.description },
  ...programs.map((p) => ({
    path: `/programs/${p.slug}`,
    title: p.name,
    description: t.programs.descriptionFor.replace('{name}', p.name),
    keywords: p.quote,
  })),
  {
    path: '/rsvp',
    title: t.rsvp.title,
    description: t.rsvp.description,
    keywords: 'rsvp sign up seat next session date attend',
  },
  {
    path: '/give',
    title: t.give.title,
    description: t.give.description,
    keywords: 'donate gift money support',
  },
  { path: '/impact', title: t.impact.title, description: t.impact.description },
  {
    path: '/transparency',
    title: t.transparency.title,
    description: t.transparency.description,
    keywords: 'ein 990 board nonprofit stack over shine legal',
  },
  {
    path: '/about',
    title: t.about.title,
    description: t.about.description,
    keywords: 'mission story stack over shine sos',
  },
  {
    path: '/about/team',
    title: t.team.title,
    description: t.team.description,
    keywords: 'dub warfield owner',
  },
  { path: '/news', title: t.news.title, description: t.news.description },
  {
    path: '/press',
    title: t.press.title,
    description: t.press.description,
    keywords: 'logo media kit',
  },
  {
    path: '/contact',
    title: t.contact.title,
    description: t.contact.description,
    keywords: 'email phone text address p30 crisis 988',
  },
  { path: '/search', title: t.search.title, description: t.search.description },
  { path: '/legal/privacy', title: t.legal.privacyTitle, description: t.legal.privacyDescription },
  {
    path: '/legal/donor-privacy',
    title: t.legal.donorPrivacyTitle,
    description: t.legal.donorPrivacyDescription,
  },
  { path: '/legal/terms', title: t.legal.termsTitle, description: t.legal.termsDescription },
  {
    path: '/legal/accessibility',
    title: t.legal.accessibilityTitle,
    description: t.legal.accessibilityDescription,
  },
  { path: '/legal/cookies', title: t.legal.cookiesTitle, description: t.legal.cookiesDescription },
  { path: '/styleguide', title: t.styleguide.heading, description: t.styleguide.description },
];

export function page(path: string): SitePage {
  const p = sitePages.find((x) => x.path === path);
  if (!p) throw new Error(`Unknown page ${path}: add it to content/pages.ts`);
  return p;
}

/** Simple, private site search: no third party, works without JavaScript (GET /search?q=). */
export function searchPages(query: string): SitePage[] {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 1);
  if (!words.length) return [];
  return sitePages
    .filter((p) => p.path !== '/search' && p.path !== '/styleguide')
    .map((p) => {
      const title = p.title.toLowerCase();
      const body = `${p.description} ${p.keywords ?? ''}`.toLowerCase();
      const score = words.reduce(
        (n, w) => n + (title.includes(w) ? 3 : 0) + (body.includes(w) ? 1 : 0),
        0,
      );
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.p);
}

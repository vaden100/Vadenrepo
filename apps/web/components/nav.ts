import { strings } from '@ns1/i18n';

const t = strings().nav;

/** Main navigation, in priority order (SPEC 5). */
export const primaryNav = [
  { href: '/programs/safe-sessions', label: t.sessions },
  { href: '/programs', label: t.programs },
  { href: '/about', label: t.about },
  { href: '/impact', label: t.impact },
  { href: '/transparency', label: t.transparency },
  { href: '/contact', label: t.contact },
];

export const footerNav = [
  ...primaryNav,
  { href: '/about/team', label: t.team },
  { href: '/news', label: t.news },
  { href: '/press', label: t.press },
  { href: '/give', label: t.give },
  { href: '/search', label: t.search },
];

export const legalNav = [
  { href: '/legal/privacy', label: t.privacy },
  { href: '/legal/donor-privacy', label: t.donorPrivacy },
  { href: '/legal/terms', label: t.terms },
  { href: '/legal/accessibility', label: t.accessibility },
  { href: '/legal/cookies', label: t.cookies },
];

import { en } from '@rmmm/ui';

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL per environment (no trailing slash). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
  /\/$/,
  '',
);

export interface NavItem {
  href: string;
  label: string;
  /** Extra words the command palette matches on. */
  keywords?: string;
}

/** Primary navigation. Only destinations that work today (docs/website-foundations.md 1). */
export const primaryNav: NavItem[] = [
  { href: '/lookup', label: en.nav.lookup, keywords: 'search check handle cashtag phone' },
  {
    href: '/report',
    label: en.report.nav,
    keywords: 'report submit story receipts scam lost money',
  },
  {
    href: '/resources',
    label: en.nav.resources,
    keywords: 'help guides ftc ic3 dispute chargeback',
  },
  { href: '/about', label: en.nav.about, keywords: 'series vaden how it works' },
  { href: '/contact', label: en.nav.contact, keywords: 'email press business legal' },
];

/** Everything the command palette can open. */
export const paletteDestinations: NavItem[] = [
  { href: '/', label: en.nav.home },
  ...primaryNav,
  {
    href: '/resources/before-you-pay',
    label: 'Before You Pay checklist',
    keywords: 'deposit tips',
  },
  {
    href: '/resources/report-it',
    label: 'Report it to the FTC, IC3 or your state',
    keywords: 'ftc ic3 attorney general police',
  },
  {
    href: '/resources/payment-disputes',
    label: 'Dispute a payment',
    keywords: 'cash app zelle venmo paypal card refund chargeback',
  },
  {
    href: '/report/status',
    label: en.report.status.title,
    keywords: 'case code claim code status',
  },
  { href: '/account', label: en.account.title, keywords: 'sign in profile' },
  {
    href: '/privacy-settings',
    label: en.nav.privacySettings,
    keywords: 'cookies consent analytics',
  },
  { href: '/account/delete', label: en.account.deleteLink, keywords: 'gdpr ccpa remove erase' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/accessibility', label: 'Accessibility statement' },
];

export const absoluteUrl = (path: string) =>
  `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;

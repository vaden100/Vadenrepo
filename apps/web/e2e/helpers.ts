import { expect, type Page } from '@playwright/test';
import { CONSENT_COOKIE, CONSENT_VERSION } from '../lib/consent';

/** Public, indexable pages (keep in sync with app/sitemap.ts). */
export const PUBLIC_PAGES = [
  '/',
  '/lookup',
  '/report',
  '/report/status',
  '/resources',
  '/resources/before-you-pay',
  '/resources/payment-disputes',
  '/resources/report-it',
  '/about',
  '/contact',
  '/privacy-settings',
  '/legal/privacy',
  '/legal/terms',
  '/legal/cookies',
  '/legal/accessibility',
  '/legal/subprocessors',
  '/legal/dmca',
  '/legal/refunds',
  '/auth',
  '/styleguide',
];

/** Collects console errors and CSP violations for the lifetime of the page. */
export function watchConsole(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  return problems;
}

/** Records a privacy choice (as the server would) so the banner does not cover content. */
export async function decideConsent(page: Page, analytics = false) {
  const value = JSON.stringify({
    version: CONSENT_VERSION,
    analytics,
    marketing: false,
    decidedAt: '2026-10-05T12:00:00.000Z',
  });
  await page
    .context()
    .addCookies([
      { name: CONSENT_COOKIE, value: encodeURIComponent(value), url: 'http://127.0.0.1:3400' },
    ]);
}

export async function noHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(0);
}

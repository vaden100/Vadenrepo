import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

/** WBS 98: a change that breaks the design fails CI. Update with `pnpm test:e2e:update`. */
const SHOTS: [string, string][] = [
  ['home', '/'],
  ['lookup', '/lookup?q=%24TeeLaces'],
  ['resources', '/resources'],
  ['disputes', '/resources/payment-disputes'],
  ['contact', '/contact'],
  ['not-found', '/resources/paymnt-disputes'],
  ['privacy-settings', '/privacy-settings'],
];

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`visual ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });
    for (const [name, path] of SHOTS) {
      test(name, async ({ page }) => {
        await decideConsent(page);
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.evaluate(() => document.fonts.ready);
        await expect(page).toHaveScreenshot(`${name}-${scheme}.png`, { fullPage: false });
      });
    }
  });
}

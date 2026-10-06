import { expect, test } from '@playwright/test';
import { decideConsent, noHorizontalOverflow } from './helpers';

/** WBS 22: the widths the spec names, portrait and landscape phones. */
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const PAGES = [
  '/',
  '/lookup',
  '/resources/payment-disputes',
  '/contact',
  '/legal/cookies',
  '/styleguide',
];

test.describe('responsive', () => {
  test.skip(({ isMobile }) => isMobile, 'viewport is set per case');
  test.beforeEach(async ({ page }) => decideConsent(page));

  for (const width of WIDTHS) {
    test(`${width}px: no horizontal overflow, navigation reachable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of PAGES) {
        await page.goto(path);
        await noHorizontalOverflow(page);
      }
      if (width < 768) {
        await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Main' }).first()).toBeHidden();
      } else {
        await expect(page.getByRole('navigation', { name: 'Main' }).first()).toBeVisible();
      }
    });
  }

  test('touch targets on mobile are at least 44px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/contact');
    const small = await page.evaluate(() =>
      [
        ...document.querySelectorAll<HTMLElement>(
          'main button, main input, main select, header button, header a',
        ),
      ]
        .filter((el) => el.offsetParent !== null && !el.closest('.hp'))
        .map((el) => ({ el: el.outerHTML.slice(0, 80), h: el.getBoundingClientRect().height }))
        .filter((x) => x.h < 44),
    );
    expect(small).toEqual([]);
  });
});

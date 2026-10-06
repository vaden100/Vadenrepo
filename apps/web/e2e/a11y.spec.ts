import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { decideConsent, PUBLIC_PAGES } from './helpers';

/** WBS 24, 95: automated WCAG 2.2 AA scan of every public page, both themes. */
for (const scheme of ['dark', 'light'] as const) {
  test.describe(`axe (${scheme})`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => decideConsent(page));

    for (const path of PUBLIC_PAGES) {
      test(path, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const summary = results.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
        );
        expect(summary, summary.join('\n')).toEqual([]);
      });
    }
  });
}

test('axe with the cookie banner and an open dialog', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Your privacy choices' })).toBeVisible();
  await page.getByRole('button', { name: /Search pages/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});

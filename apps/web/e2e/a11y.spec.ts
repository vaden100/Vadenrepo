import { expect, test } from '@playwright/test';
import {
  expectNoAxeViolations,
  MODES,
  noHorizontalOverflow,
  PAGES,
  presetReading,
  watchConsole,
} from './helpers';

for (const path of PAGES) {
  for (const [mode, media] of Object.entries(MODES)) {
    test(`${path} passes axe in ${mode}`, async ({ page }) => {
      const problems = watchConsole(page);
      await page.emulateMedia(media);
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expectNoAxeViolations(page);
      expect(problems).toEqual([]);
    });
  }

  test(`${path} passes axe with every reading setting on`, async ({ page }) => {
    await presetReading(page, {
      textSize: 'larger',
      spacing: true,
      motion: true,
      contrast: true,
      theme: 'dark',
    });
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'more');
    await expectNoAxeViolations(page);
  });

  test(`${path} has no horizontal scroll at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(path);
    await noHorizontalOverflow(page);
    await presetReading(page, { textSize: 'larger', spacing: true });
    await page.reload();
    await noHorizontalOverflow(page);
  });
}

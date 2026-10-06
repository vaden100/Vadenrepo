import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('durations collapse to zero and nothing animates', async ({ page }) => {
    await decideConsent(page);
    await page.goto('/styleguide');
    const durations = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return ['--duration-fast', '--duration-normal', '--duration-slow', '--motion-stamp-slam'].map(
        (v) => s.getPropertyValue(v).trim(),
      );
    });
    expect(durations).toEqual(['0ms', '0ms', '0ms', '0ms']);
    await page.getByRole('button', { name: 'Next status' }).click();
    const anim = await page
      .locator('.rmmm-stamp--slam')
      .first()
      .evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe('none');
  });
});

test('with motion allowed the stamp slams on a status change', async ({ page }) => {
  await decideConsent(page);
  await page.goto('/styleguide');
  await page.getByRole('button', { name: 'Next status' }).click();
  const anim = await page
    .locator('.rmmm-stamp--slam')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(anim).toBe('rmmm-slam');
});

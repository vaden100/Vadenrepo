import { expect, test } from '@playwright/test';

/** WBS 31, 84, 85, 101 to 103, 146: nothing optional loads before an explicit choice. */
test.describe('consent', () => {
  test('no analytics before consent; "Necessary only" keeps it off', async ({ page }) => {
    const analytics: string[] = [];
    await page.route('https://plausible.io/**', (r) => {
      analytics.push(r.request().url());
      return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    await page.goto('/');
    const banner = page.getByRole('region', { name: 'Your privacy choices' });
    await expect(banner).toBeVisible();
    // Equal weight: both choices are the same button style.
    const reject = banner.getByRole('button', { name: 'Necessary only' });
    const accept = banner.getByRole('button', { name: 'Allow analytics' });
    expect(await reject.getAttribute('class')).toBe(await accept.getAttribute('class'));
    await page.waitForTimeout(500);
    expect(analytics).toEqual([]);

    await reject.click();
    await expect(banner).toBeHidden();
    await page.reload();
    await expect(page.getByRole('region', { name: 'Your privacy choices' })).toHaveCount(0);
    await page.waitForTimeout(500);
    expect(analytics).toEqual([]);
    const consent = (await page.context().cookies()).find((c) => c.name === 'rmmm_consent');
    expect(consent?.httpOnly).toBe(true);
    expect(decodeURIComponent(consent!.value)).toContain('"analytics":false');
  });

  test('allowing analytics loads it, and it can be turned off later', async ({ page }) => {
    const analytics: string[] = [];
    await page.route('https://plausible.io/**', (r) => {
      analytics.push(r.request().url());
      return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics' }).click();
    await expect.poll(() => analytics.length).toBeGreaterThan(0);

    await page.goto('/privacy-settings');
    await expect(page.getByRole('radio', { name: 'On' })).toBeChecked();
    await page.getByRole('radio', { name: 'Off' }).check();
    await page.getByRole('button', { name: 'Save my choices' }).click();
    await expect(page.getByText('Your privacy choices are saved.')).toBeVisible();
    analytics.length = 0;
    await page.goto('/about');
    await page.waitForTimeout(500);
    expect(analytics).toEqual([]);
  });

  test('preference center works with keyboard only', async ({ page, isMobile }) => {
    test.skip(isMobile, 'keyboard');
    await page.goto('/privacy-settings');
    await page.getByRole('radio', { name: 'Off' }).focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: 'On' })).toBeChecked();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Save my choices' })).toBeFocused();
  });

  test('no third-party requests at all on a fresh visit', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.hostname !== '127.0.0.1') external.push(u.hostname);
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(external).toEqual([]);
  });
});

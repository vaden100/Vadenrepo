import { expect, test } from '@playwright/test';
import { watchConsole } from './helpers';

test('security headers and nonce CSP on every page', async ({ page, request }) => {
  for (const path of ['/', '/styleguide', '/does-not-exist']) {
    const res = await request.get(path);
    const csp = res.headers()['content-security-policy'] ?? '';
    const script = csp.split(';').find((d) => d.trim().startsWith('script-src')) ?? '';
    expect(script).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
    expect(res.headers()['x-frame-options']).toBe('DENY');
    expect(res.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers()['permissions-policy']).toContain('geolocation=()');
  }
  const a = (await request.get('/')).headers()['content-security-policy'];
  const b = (await request.get('/')).headers()['content-security-policy'];
  expect(a).not.toBe(b);
  await page.goto('/');
});

test('fonts are self-hosted: no third-party requests', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['127.0.0.1', 'localhost'].includes(u.hostname) && !u.protocol.startsWith('data'))
      external.push(r.url());
  });
  await page.goto('/styleguide');
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
  expect(
    await page.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible Next Variable"')),
  ).toBe(true);
});

test('skip link moves focus to main', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'Safari needs Option+Tab for links');
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('reading settings: keyboard, saved in the browser, applied before paint', async ({ page }) => {
  const problems = watchConsole(page);
  await page.goto('/');
  const open = page.getByRole('banner').getByRole('button', { name: 'Reading settings' });
  await open.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Reading settings' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: 'Larger' }).check();
  await dialog.getByRole('checkbox', { name: 'High contrast' }).check();
  await expect(dialog.getByRole('status')).toHaveText('Saved on this device.');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();

  // Applied by the inline init script, before hydration: present in the first paint.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await expect(page.locator('html')).toHaveAttribute('data-contrast', 'more');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(['rgb(255, 255, 255)', 'rgb(0, 0, 0)']).toContain(bg);

  // Reset clears everything.
  await page.getByRole('contentinfo').getByRole('button', { name: 'Reading settings' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset settings' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-text-size', /.*/);
  expect(problems).toEqual([]);
});

test('reduced motion stops the skeleton animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/styleguide');
  const duration = await page
    .locator('.skeleton__line')
    .first()
    .evaluate((el) => getComputedStyle(el).animationDuration);
  expect(parseFloat(duration)).toBeLessThan(0.01);
});

test('favicon, touch icon and social image come from brand/', async ({ request }) => {
  const icon = await request.get('/icon.svg');
  expect(icon.ok()).toBe(true);
  expect(await icon.text()).toContain('prefers-color-scheme:dark');
  const og = await request.get('/opengraph-image');
  expect(og.headers()['content-type']).toBe('image/png');
  const apple = await request.get('/apple-icon');
  expect(apple.headers()['content-type']).toBe('image/png');
});

test('unknown pages get a helpful 404', async ({ page }) => {
  const res = await page.goto('/nothing-here');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We could not find that page');
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
});

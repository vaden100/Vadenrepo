import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

test.beforeEach(async ({ page }) => decideConsent(page));

test('404 turns the broken address into a usable path', async ({ page }) => {
  const res = await page.goto('/resources/paymnt-disputes');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Nothing filed under this address',
  );
  const path = page.getByRole('navigation', { name: 'Path' });
  await expect(path.getByRole('link', { name: 'resources' })).toHaveAttribute('href', '/resources');
  await expect(path.locator('del')).toHaveText('paymnt-disputes');
  await page.getByRole('link', { name: /Dispute a payment/ }).click();
  await expect(page).toHaveURL(/\/resources\/payment-disputes$/);
});

test('404 is noindex and keeps navigation', async ({ page }) => {
  await page.goto('/no-such-page');
  await expect(page.locator('meta[name="robots"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
});

test('offline banner appears and clears', async ({ page, context }) => {
  await page.goto('/');
  await context.setOffline(true);
  await expect(page.getByText('You appear to be offline.')).toBeVisible();
  await context.setOffline(false);
  await expect(page.getByText('Back online.')).toBeVisible();
});

test('API errors are JSON without internals', async ({ request }) => {
  const res = await request.post('/api/consent', {
    data: 'not json',
    headers: { 'content-type': 'application/json' },
  });
  expect([422, 429]).toContain(res.status());
  const text = await res.text();
  expect(text).not.toMatch(/at \w+ \(|node_modules|stack/i);
});

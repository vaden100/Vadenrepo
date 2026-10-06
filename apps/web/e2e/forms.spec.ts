import { expect, test, type Page } from '@playwright/test';
import { decideConsent } from './helpers';

test.beforeEach(async ({ page }) => decideConsent(page));

async function fillValid(page: Page) {
  await page.getByLabel('What is this about?').selectOption('press');
  await page.getByLabel('Your name').fill('Dee Demo');
  await page.getByLabel('Email for our reply').fill('dee@example.demo');
  await page.getByLabel('Message').fill('Hello team, this is a message that is long enough.');
}

test('client validation lists problems and focuses the first invalid field', async ({ page }) => {
  await page.goto('/contact');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('main').getByRole('alert').first()).toContainText('Fix 4 problems');
  await expect(page.getByLabel('What is this about?')).toBeFocused();
  await expect(page.getByLabel('Your name')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Write a message of at least 20 characters.')).toBeVisible();
});

test('success is shown only after the server confirms, with a reference', async ({ page }) => {
  await page.route('/api/contact', async (route) => {
    await new Promise((r) => setTimeout(r, 300));
    await route.fulfill({ status: 201, json: { ok: true, ref: 'AB12CD34' } });
  });
  await page.goto('/contact');
  await fillValid(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('button', { name: 'Sending' })).toHaveAttribute('aria-busy', 'true');
  await expect(page.getByText('Message received')).toBeVisible();
  await expect(page.getByText('Reference AB12CD34')).toBeVisible();
});

test('rate limited: says so and keeps the text', async ({ page }) => {
  await page.route('/api/contact', (route) =>
    route.fulfill({ status: 429, json: { error: 'rate_limited', message: 'x' } }),
  );
  await page.goto('/contact');
  await fillValid(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('main').getByRole('alert').first()).toContainText('Too many tries');
  await expect(page.getByLabel('Message')).toHaveValue(/long enough/);
});

test('network failure: says so and keeps the text', async ({ page }) => {
  await page.route('/api/contact', (route) => route.abort('internetdisconnected'));
  await page.goto('/contact');
  await fillValid(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('main').getByRole('alert').first()).toContainText(
    'could not reach the server',
  );
  await expect(page.getByLabel('Your name')).toHaveValue('Dee Demo');
});

test('server-side validation errors map back onto fields', async ({ page }) => {
  await page.route('/api/contact', (route) =>
    route.fulfill({
      status: 422,
      json: { error: 'invalid', message: 'x', fields: { email: 'invalid_format' } },
    }),
  );
  await page.goto('/contact');
  await fillValid(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Enter an email address we can reply to.')).toBeVisible();
  await expect(page.getByLabel('Email for our reply')).toBeFocused();
});

test('real server without a database answers 503 and the UI explains it', async ({ page }) => {
  await page.goto('/contact');
  await fillValid(page);
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.locator('main').getByRole('alert').first()).toContainText(
    /Messages cannot be sent right now|Too many tries/,
  );
});

test('the API refuses cross-site posts and invalid bodies', async ({ request }) => {
  const cross = await request.post('/api/contact', {
    headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' },
    data: {},
  });
  expect(cross.status()).toBe(403);
  const bad = await request.post('/api/contact', { data: { reason: 'nope' } });
  expect([422, 429]).toContain(bad.status());
  if (bad.status() === 422) expect((await bad.json()).fields).toHaveProperty('reason');
});

test('honeypot submissions are swallowed', async ({ request }) => {
  const res = await request.post('/api/contact', {
    data: {
      reason: 'press',
      name: 'Bot',
      email: 'bot@example.demo',
      message: 'x'.repeat(30),
      website: 'http://spam',
    },
  });
  expect([200, 429]).toContain(res.status());
});

test('deletion request requires sign-in', async ({ page, request }) => {
  await page.goto('/account/delete');
  await expect(page).toHaveURL(/\/auth\?next=%2Faccount%2Fdelete/);
  const res = await request.post('/api/privacy/delete', { data: { confirm: true } });
  expect([401, 429, 503]).toContain(res.status());
});

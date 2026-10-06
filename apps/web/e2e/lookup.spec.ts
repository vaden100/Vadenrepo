import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

test.beforeEach(async ({ page }) => decideConsent(page));

test('hero check classifies as you type', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Business, @handle, $cashtag, phone, email or website');
  await input.click();
  await input.fill('$Tee Laces');
  const readout = page.locator('.probe__readout');
  await expect(readout).toContainText('Cash App tag');
  await expect(readout).toContainText('$teelaces');
  await input.fill('(404) 555-0123');
  await expect(readout).toContainText('+14045550123');
  await input.fill('https://www.instagram.com/laced.by.tee_/');
  await expect(readout).toContainText('Social handle · Instagram');
  await expect(readout).toContainText('@laced.by.tee');
});

test('submitting goes to /lookup with an honest empty state', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('Business, @handle, $cashtag, phone, email or website');
  await input.fill('@nailz2');
  await input.press('Enter');
  await expect(page).toHaveURL(/\/lookup\?q=%40nailz2/);
  await expect(page.getByRole('heading', { name: 'Results open soon' })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('lookup still works and classifies on the server', async ({ page }) => {
    await page.goto('/lookup?q=%24TeeLaces');
    await expect(page.getByRole('heading', { name: 'Lookup' })).toBeVisible();
    const readout = page.locator('.probe__readout');
    await expect(readout).toContainText('Cash App tag');
    await expect(readout).toContainText('$teelaces');
    await expect(
      page.getByLabel('Business, @handle, $cashtag, phone, email or website'),
    ).toHaveValue('$TeeLaces');
  });
  test('home page content is all there', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('look them up');
    await expect(page.getByText('A person checks the evidence')).toBeVisible();
  });
});

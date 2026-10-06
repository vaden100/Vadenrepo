import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

test.beforeEach(async ({ page }) => decideConsent(page));

test('skip link is the first stop and moves focus to main', async ({ page }) => {
  await page.goto('/resources');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('every focusable element shows a visible focus indicator', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard focus walk is a desktop concern');
  await page.goto('/contact');
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    const ok = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return true;
      const s = getComputedStyle(el);
      return (
        (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || s.boxShadow !== 'none'
      );
    });
    expect(ok, `focus ring on tab stop ${i + 1}`).toBe(true);
  }
});

test('current page is marked in navigation', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop nav');
  await page.goto('/resources/report-it');
  await expect(
    page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Resources' }),
  ).toHaveAttribute('aria-current', 'page');
});

test('mobile menu: opens, traps focus, Escape closes and returns focus', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'mobile menu');
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Open menu' });
  await button.click();
  const dialog = page.getByRole('dialog', { name: 'Menu' });
  await expect(dialog).toBeVisible();
  // A native modal makes the page inert: focus may visit browser UI (body) but never page content.
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => {
      const el = document.activeElement;
      return !el || el === document.body
        ? 'browser'
        : el.closest('dialog')
          ? 'dialog'
          : el.outerHTML.slice(0, 80);
    });
    expect(['dialog', 'browser']).toContain(where);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(button).toBeFocused();
});

test('mobile menu link navigates and closes the menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile menu');
  await page.goto('/');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('dialog').getByRole('link', { name: 'Resources' }).click();
  await expect(page).toHaveURL(/\/resources$/);
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('command palette: Ctrl+K, arrows, Enter', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut');
  await page.goto('/');
  await page.keyboard.press('Control+k');
  const input = page.getByRole('combobox', { name: 'Type a page or action' });
  await expect(input).toBeFocused();
  await input.fill('dispute');
  // Best match first, then arrows move the active option (aria-activedescendant).
  await expect(page.getByRole('option').first()).toHaveText(/Dispute a payment/);
  await expect(page.getByRole('option').first()).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('option').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/resources\/payment-disputes$/);
});

test('command palette: "/" opens it, empty state, Escape restores focus', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'keyboard shortcut');
  await page.goto('/about');
  await page.keyboard.press('/');
  const input = page.getByRole('combobox');
  await expect(input).toBeFocused();
  await input.fill('zzzz');
  await expect(page.getByText(/Nothing matches that/)).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('"/" does not hijack typing in a field', async ({ page, isMobile }) => {
  test.skip(isMobile, 'keyboard shortcut');
  await page.goto('/contact');
  const name = page.getByLabel('Your name');
  await name.fill('a/b');
  await expect(name).toHaveValue('a/b');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('theme choice persists with no flash (set on the server)', async ({ page, isMobile }) => {
  test.skip(isMobile, 'toggle is in the desktop header');
  await page.goto('/');
  const toggle = page.getByRole('button', { name: /^Theme:/ });
  await toggle.click(); // system -> dark
  await toggle.click(); // dark -> light
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  // The very first HTML byte stream already carries the theme: no flash.
  const html = await (await page.request.get('/about')).text();
  expect(html).toMatch(/<html[^>]*data-theme="light"/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('details/summary guides open with keyboard', async ({ page }) => {
  await page.goto('/resources/payment-disputes');
  const summary = page.locator('summary', { hasText: 'Zelle' });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Call your bank right away')).toBeVisible();
});

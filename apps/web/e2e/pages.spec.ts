import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { sitePages } from '../content/pages';
import { PAGES } from './helpers';

const factsDoc = fs.readFileSync(path.resolve(process.cwd(), '../../docs/facts.md'), 'utf8');

test('every page has one h1, a unique title and a description (SPEC 13)', async ({ page }) => {
  const titles = new Map<string, string>();
  for (const p of PAGES) {
    const res = await page.goto(p);
    expect(res?.status(), p).toBe(200);
    await expect(page.locator('h1'), p).toHaveCount(1);
    const title = await page.title();
    expect(titles.has(title), `${p} reuses the title of ${titles.get(title)}`).toBe(false);
    titles.set(title, p);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length, p).toBeGreaterThan(20);
  }
});

test('every number on a page traces to docs/facts.md (SPEC 18, Phase 2)', async ({ page }) => {
  // Legal drafts cite standards (WCAG 2.2, 400 percent); the style guide shows token values.
  const pages = PAGES.filter((p) => !p.startsWith('/legal/') && p !== '/styleguide');
  for (const p of pages) {
    await page.goto(p);
    const text = await page.locator('main').innerText();
    for (const n of text.match(/\d[\d,.]*/g) ?? []) {
      const num = n.replace(/[.,]$/, '');
      // Names of IRS forms and statuses, not figures.
      if (['990', '501'].includes(num)) continue;
      expect(factsDoc.includes(num), `${p}: "${num}" is not in docs/facts.md`).toBe(true);
    }
  }
});

test('placeholders look like placeholders and are listed', async ({ page }) => {
  await page.goto('/transparency');
  const marks = page.locator('mark.placeholder');
  expect(await marks.count()).toBeGreaterThan(2);
  await expect(marks.first()).toContainText('needs source');
});

test('the site never claims tax deductibility before it is confirmed', async ({ page }) => {
  for (const p of PAGES) {
    await page.goto(p);
    const text = (await page.locator('body').innerText()).toLowerCase();
    expect(text, p).not.toContain('tax-deductible');
    expect(text, p).not.toContain('501(c)(3)');
  }
});

test('home: doors, signature table with its text, structured data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Give to the gallery' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'See S.A.F.E Sessions' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Book or collaborate' })).toBeVisible();
  await expect(page.getByText('10 to 15 people sit at each S.A.F.E Session')).toBeVisible();
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const types = ld.map((j) => JSON.parse(j)['@type']);
  expect(types).toContain('NGO');
});

test('inner pages carry breadcrumbs with structured data', async ({ page }) => {
  await page.goto('/programs/safe-sessions');
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link', { name: 'Programs' })).toBeVisible();
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((j) =>
    JSON.parse(j),
  );
  expect(ld.find((x) => x['@type'] === 'BreadcrumbList')?.itemListElement).toHaveLength(3);
});

test('legal pages are marked as drafts', async ({ page }) => {
  for (const p of PAGES.filter((x) => x.startsWith('/legal/'))) {
    await page.goto(p);
    await expect(
      page.getByText('Draft. A lawyer has not reviewed this page yet.'),
      p,
    ).toBeVisible();
  }
});

test('sitemap and robots list the public pages', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const p of sitePages.filter((x) => !['/styleguide', '/search'].includes(x.path)))
    expect(xml, p.path).toContain(
      `<loc>http://127.0.0.1:3400${p.path === '/' ? '' : p.path}</loc>`,
    );
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: http://127.0.0.1:3400/sitemap.xml');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('search works', async ({ page }) => {
    await page.goto('/search');
    await page.getByLabel('Search the site').fill('988');
    await page.getByRole('button', { name: 'Search the site' }).click();
    await expect(page).toHaveURL(/\/search\?q=988/);
    await expect(page.getByRole('link', { name: 'Contact' }).last()).toBeVisible();
  });

  test('the small-screen menu opens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto('/');
    await page.getByText('Menu', { exact: true }).click();
    await expect(
      page.locator('.mobile-menu').getByRole('link', { name: 'Transparency' }),
    ).toBeVisible();
  });
});

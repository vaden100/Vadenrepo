import { expect, test } from '@playwright/test';
import { decideConsent, noHorizontalOverflow, PUBLIC_PAGES, watchConsole } from './helpers';

test.describe('every public page', () => {
  test.beforeEach(async ({ page }) => decideConsent(page));

  for (const path of PUBLIC_PAGES) {
    test(`${path} renders cleanly`, async ({ page }) => {
      const problems = watchConsole(page);
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await page.waitForLoadState('networkidle');

      // One h1, a unique title and a description (WBS 26, 133).
      await expect(page.locator('h1')).toHaveCount(1);
      const title = await page.title();
      expect(title.length).toBeGreaterThan(5);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();

      // Landmarks (WBS 132).
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('main#main')).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();

      // Security headers on the document (WBS 91).
      const h = res!.headers();
      expect(h['content-security-policy']).toMatch(/script-src 'nonce-[^']+' 'strict-dynamic'/);
      expect(h['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/);
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(h['permissions-policy']).toContain('geolocation=()');

      await noHorizontalOverflow(page);
      expect(problems, problems.join('\n')).toEqual([]);
    });
  }

  test('titles are unique across pages', async ({ page }) => {
    const titles = new Map<string, string>();
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      const t = await page.title();
      expect(titles.get(t), `"${t}" used by ${titles.get(t)} and ${path}`).toBeUndefined();
      titles.set(t, path);
    }
  });
});

test.describe('SEO plumbing', () => {
  test('canonical, Open Graph and X card on content pages', async ({ page }) => {
    await page.goto('/resources/payment-disputes');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'http://127.0.0.1:3400/resources/payment-disputes',
    );
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og).toContain('/og?');
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
    const img = await page.request.get(og!);
    expect(img.status()).toBe(200);
    expect(img.headers()['content-type']).toBe('image/png');
  });

  test('structured data is valid JSON with real types only', async ({ page }) => {
    await page.goto('/resources/report-it');
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const types = blocks.flatMap((b) => {
      const j = JSON.parse(b);
      return j['@graph'] ? j['@graph'].map((x: { '@type': string }) => x['@type']) : [j['@type']];
    });
    expect(types.sort()).toEqual(['BreadcrumbList', 'Organization', 'WebSite']);
  });

  test('sitemap and robots', async ({ request }) => {
    const sm = await (await request.get('/sitemap.xml')).text();
    expect(sm).toContain('/resources/before-you-pay');
    expect(sm).not.toContain('/account');
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Disallow: /account');
    expect(robots).toContain('Sitemap:');
  });

  test('private and utility pages are noindex', async ({ page }) => {
    for (const p of ['/privacy-settings', '/styleguide', '/auth']) {
      await page.goto(p);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    }
  });
});

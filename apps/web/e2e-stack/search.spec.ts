import AxeBuilder from '@axe-core/playwright';
import { phash } from '@rmmm/media-hash';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { decideConsent } from '../e2e/helpers';
import { psql, WEB } from './staff';

/**
 * SPEC 16 Phase 4 acceptance, against the real stack:
 *   nailz and nailz2 sharing a cashtag are linked with the reason shown;
 *   a phone in 4 formats resolves to one entity;
 *   a non-public entity returns "under review" only;
 *   search stays fast (the 100k-identifier p95 check runs in pgTAP 12_search_perf.sql).
 */
const R = `${Date.now() % 100000}`;
const NAILZ = `nailz-e2e-${R}`;
const NAILZ2 = `nailz2-e2e-${R}`;
const HIDDEN = `hidden-e2e-${R}`;
const PHONE = `+1404555${R.padStart(5, '0').slice(-4)}`;

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

const search = async (q: string, ip = '198.18.2.1') =>
  (await (
    await fetch(`${WEB}/api/search?q=${encodeURIComponent(q)}`, {
      headers: { 'x-forwarded-for': ip },
    })
  ).json()) as {
    results: { slug: string; reasons: string[]; links: { slug: string; reason: string }[] }[];
    underReview: boolean;
  };

let flyer: Buffer;

test.beforeAll(async () => {
  flyer = await sharp(
    Buffer.from(`<svg width="600" height="800"><rect width="600" height="800" fill="#f5c518"/>
      <rect x="30" y="30" width="540" height="180" fill="#111"/><circle cx="420" cy="520" r="130" fill="#c8202b"/>
      <text x="50" y="140" font-size="70" fill="#fff">NAILZ ${R}</text><text x="50" y="420" font-size="60">$40 DEPOSIT</text></svg>`),
  )
    .png()
    .toBuffer();
  const hash = await phash(flyer);
  // Two public pages that share a Cash App tag (one is a rebrand), and one not reviewed yet.
  psql(`
    insert into entities (id, slug, display_name, city, state, category, is_public) values
      ('00000000-0000-4000-9000-0000000${R.padStart(5, '0')}', '${NAILZ}', 'Nailz E2E ${R}', 'Atlanta', 'GA', 'deposit_no_show', true),
      ('00000000-0000-4000-9001-0000000${R.padStart(5, '0')}', '${NAILZ2}', 'nailz2 E2E ${R}', 'Atlanta', 'GA', 'deposit_no_show', true),
      ('00000000-0000-4000-9002-0000000${R.padStart(5, '0')}', '${HIDDEN}', 'Hidden E2E ${R}', 'Macon', 'GA', 'other', false);
    insert into entity_identifiers (entity_id, type, raw, norm, norm_loose) values
      ('00000000-0000-4000-9000-0000000${R.padStart(5, '0')}', 'handle_ig', '@nailz${R}', 'nailz${R}', 'nailz${R}'),
      ('00000000-0000-4000-9000-0000000${R.padStart(5, '0')}', 'cashtag', '$NailzPay${R}', 'nailzpay${R}', null),
      ('00000000-0000-4000-9000-0000000${R.padStart(5, '0')}', 'phone', '(404) 555-${PHONE.slice(-4)}', '${PHONE}', null),
      ('00000000-0000-4000-9001-0000000${R.padStart(5, '0')}', 'handle_ig', '@nailz${R}2', 'nailz${R}2', 'nailz${R}'),
      ('00000000-0000-4000-9001-0000000${R.padStart(5, '0')}', 'cashtag', '$NailzPay${R}', 'nailzpay${R}', null),
      ('00000000-0000-4000-9002-0000000${R.padStart(5, '0')}', 'cashtag', '$Hidden${R}', 'hidden${R}', null);
    insert into reports (id, status, category, story, amount_cents, city, state, submitted_at, public_excerpt) values
      ('00000000-0000-4000-9003-0000000${R.padStart(5, '0')}', 'approved', 'deposit_no_show', 'Paid a 40 dollar deposit for nails, no show.', 4000,
       'Atlanta', 'GA', now() - interval '3 days', 'I paid the deposit and the appointment never happened.');
    insert into report_entities values ('00000000-0000-4000-9003-0000000${R.padStart(5, '0')}', '00000000-0000-4000-9000-0000000${R.padStart(5, '0')}');
    insert into media (report_id, kind, storage_path, upload_status, phash) values
      ('00000000-0000-4000-9003-0000000${R.padStart(5, '0')}', 'image', 'reports/e2e/flyer.jpg', 'ready', ${hash});
  `);
});

test('nailz and nailz2 share a cashtag: linked, with the reason shown', async ({ page }) => {
  await decideConsent(page);
  await page.goto(`/lookup?q=${encodeURIComponent(`$NailzPay${R}`)}`);
  const hits = page.getByTestId('search-hit');
  await expect(hits).toHaveCount(2);
  await expect(hits.first().getByText('Same Cash App tag').first()).toBeVisible();
  await expect(page.getByText('Reported 1 time').first()).toBeVisible();
  await axe(page);

  await page.goto(`/entities/${NAILZ}`);
  await expect(page.getByRole('heading', { level: 1, name: `Nailz E2E ${R}` })).toBeVisible();
  const linked = page.locator('.rmmm-linked');
  await expect(linked.getByRole('link', { name: `nailz2 E2E ${R}` })).toBeVisible();
  await expect(linked.getByText('Same Cash App tag')).toBeVisible();
  // Private details stay masked; the reviewed excerpt shows with an amount range.
  await expect(page.getByText(`(•••) •••-${PHONE.slice(-4)}`)).toBeVisible();
  await expect(page.getByText(`$N•••${`lzPay${R}`.slice(-5)}`)).toBeVisible();
  await expect(
    page.getByText('I paid the deposit and the appointment never happened.'),
  ).toBeVisible();
  await expect(page.getByText(/Under \$50/)).toBeVisible();
  expect(await page.content()).not.toContain(PHONE);
  await axe(page);

  // The rebrand handle finds the original too.
  const rebrand = await search(`@nailz${R}2`);
  expect(rebrand.results.map((r) => r.slug)).toEqual(expect.arrayContaining([NAILZ, NAILZ2]));
});

test('a phone in 4 formats resolves to one entity', async () => {
  const local = PHONE.slice(2);
  const formats = [
    `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`,
    `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`,
    `+1 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`,
    local,
  ];
  for (const [i, f] of formats.entries()) {
    const r = await search(f, `198.18.2.${10 + i}`);
    expect(
      r.results.map((x) => x.slug),
      f,
    ).toEqual([NAILZ]);
    expect(r.results[0]!.reasons, f).toContain('same_phone');
  }
});

test('a page nobody has reviewed yet only says "under review"', async ({ page }) => {
  const api = await search(`$Hidden${R}`, '198.18.2.20');
  expect(api).toEqual({
    query: { kind: 'cashtag', display: `$hidden${R}` },
    results: [],
    underReview: true,
    outside: [],
  });
  await decideConsent(page);
  await page.goto(`/lookup?q=${encodeURIComponent(`$Hidden${R}`)}`);
  await expect(page.getByText('Reports under review')).toBeVisible();
  await expect(page.getByText(`Hidden E2E ${R}`)).toHaveCount(0);
  expect((await page.goto(`/entities/${HIDDEN}`))?.status()).toBe(404);
  // Nothing matched at all: the honest empty state.
  await page.goto('/lookup?q=%24NobodyAtAll999');
  await expect(page.getByText('No reports yet.')).toBeVisible();
  await expect(page.getByText("That's not a guarantee.")).toBeVisible();
});

test('flyer check matches an image from a reviewed report', async ({ page }) => {
  await decideConsent(page);
  await page.goto('/lookup');
  const smaller = await sharp(flyer).resize(300).jpeg({ quality: 60 }).toBuffer();
  await page
    .getByTestId('flyer-input')
    .setInputFiles({ name: 'flyer.jpg', mimeType: 'image/jpeg', buffer: smaller });
  await expect(page.getByText('This image matches pictures in 1 reviewed report')).toBeVisible();
  await expect(page.getByRole('link', { name: `Nailz E2E ${R}` })).toBeVisible();
});

test('the report form spots a page that was already reported', async ({ page }) => {
  await decideConsent(page);
  await page.goto(`/report?entity=${NAILZ}`);
  await page.getByLabel('Took my deposit, then no-show').check();
  await page.getByRole('button', { name: 'Save and continue' }).click();
  await expect(page.getByLabel('Business or person name')).toHaveValue(`Nailz E2E ${R}`);
  await page.getByLabel('Cash App $cashtag').fill(`$NailzPay${R}`);
  await expect(page.getByText(/This might match a page already reported/)).toBeVisible();
  await expect(page.getByRole('link', { name: 'See the page' })).toHaveAttribute(
    'href',
    new RegExp(`/entities/(${NAILZ}|${NAILZ2})`),
  );
});

test('search over HTTP: p95 under 300 ms', async () => {
  const qs = [
    `$NailzPay${R}`,
    PHONE.slice(2),
    `@nailz${R}2`,
    `Nailz E2E ${R}`,
    `$Hidden${R}`,
    '$NobodyAtAll999',
  ];
  const times: number[] = [];
  for (let i = 0; i < 60; i++) {
    const t0 = performance.now();
    const res = await fetch(`${WEB}/api/search?q=${encodeURIComponent(qs[i % qs.length]!)}`, {
      headers: { 'x-forwarded-for': `198.18.3.${i}` },
    });
    expect(res.status).toBe(200);
    await res.json();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)]!;
  console.log(`HTTP search p95: ${p95.toFixed(1)} ms`);
  expect(p95).toBeLessThan(300);
});

test('a website on the public phishing list says so, with its source', async ({ page }) => {
  const host = `login-cashapp-verify-${R}.weeblysite.demo`;
  psql(
    `insert into outside_records (source, type, norm) values ('phishing_database', 'domain', '${host}') on conflict do nothing`,
  );
  await decideConsent(page);
  await page.goto(`/lookup?q=${encodeURIComponent(`https://${host}/pay`)}`);
  const box = page.getByTestId('outside-records');
  await expect(box).toContainText(`${host} is on Phishing.Database`);
  await expect(box).toContainText('This is not a review by our team.');
  await expect(box.getByRole('link', { name: 'Report a mistake to the list' })).toBeVisible();
  // No entity matched, so our own answer is still the honest one.
  await expect(page.getByText('No reports yet.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'By the numbers' })).toBeVisible();
  await axe(page);
});

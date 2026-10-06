import { readFile } from 'node:fs/promises';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import sharp from 'sharp';
import { decideConsent } from '../e2e/helpers';

/**
 * SPEC 16 Phase 2 acceptance: an anonymous report with 2 images + a voice note, sent through
 * the real UI; EXIF removed; claim code works; consent rows stored. Everything runs for real:
 * Postgres + PostgREST, Next, local evidence storage and the media worker.
 */
const API = (process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321') + '/rest/v1';
const KEY = process.env.SERVICE_KEY ?? '';
const STORAGE = process.env.STORAGE_LOCAL_DIR ?? '';

async function rest<T>(query: string): Promise<T> {
  const res = await fetch(`${API}/${query}`, {
    headers: { apikey: KEY, authorization: `Bearer ${KEY}` },
  });
  expect(res.ok, `${query} -> ${res.status}`).toBe(true);
  return (await res.json()) as T;
}

/** A phone photo: GPS, camera make and the owner's name in EXIF. */
function photo(color: string, label: string) {
  return sharp({ create: { width: 640, height: 480, channels: 3, background: color } })
    .composite([
      {
        input: Buffer.from(
          `<svg width="640" height="480"><text x="40" y="240" font-size="48">${label}</text></svg>`,
        ),
      },
    ])
    .withExif({
      IFD0: { Make: 'PhoneCo', Model: 'Test 12', Artist: 'Jane Reporter' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '33/1 45/1 0/1',
        GPSLongitudeRef: 'W',
        GPSLongitude: '84/1 23/1 0/1',
      },
    })
    .jpeg()
    .toBuffer();
}

async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
}

/** Set SHOT_DIR to keep a screenshot of each step (for review; not compared). */
const shot = (page: Page, name: string) =>
  process.env.SHOT_DIR
    ? page.screenshot({ path: path.join(process.env.SHOT_DIR, `${name}.png`), fullPage: true })
    : undefined;

const next = (page: Page) => page.getByRole('button', { name: 'Save and continue' }).click();
const heading = (page: Page, name: string) =>
  expect(page.getByRole('heading', { level: 2, name })).toBeVisible();

interface ReportRow {
  id: string;
  status: string;
  reporter_id: string | null;
  anon_claim_hash: string | null;
  draft_token_hash: string | null;
  submitted_ip: string | null;
  contact_mode: string;
  consent_truth: boolean;
  consent_terms: boolean;
  age_confirmed: boolean;
  amount_cents: number;
  rail: string;
}
interface MediaRow {
  kind: string;
  storage_path: string;
  upload_status: string;
  exif_stripped: boolean;
  voice_note: boolean;
  sha256: string;
  phash: number | null;
  duration_ms: number | null;
  mime: string;
}

test('anonymous report with 2 images and a voice note, end to end', async ({ page, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await decideConsent(page);
  await page.goto('/report');
  await expect(page.getByRole('heading', { level: 1, name: 'Tell your story' })).toBeVisible();
  await heading(page, 'What happened');
  await shot(page, '1-category');

  // Required steps are enforced before moving on.
  await next(page);
  await expect(page.getByText('Pick what happened.').first()).toBeVisible();
  await page.getByLabel('Took my deposit, then no-show').check();
  await next(page);

  await heading(page, 'Who');
  await next(page);
  await expect(page.getByText(/Add at least one way to identify them/).first()).toBeVisible();
  await page.getByLabel('Business or person name').fill('Tee Laces Demo Studio');
  await page.getByLabel('Instagram').fill('@teelaces.demo');
  await page.getByLabel('Cash App $cashtag').fill('$TeeLacesDemo');
  await page.getByLabel('City').fill('Atlanta');
  await shot(page, '2-who');
  await axe(page);
  await next(page);

  await heading(page, 'Money');
  await page.getByLabel(/How much did you pay/).fill('250');
  await page.getByLabel(/How did you pay/).selectOption('cashapp');
  await page.getByRole('group', { name: 'Was it a deposit?' }).getByLabel('Yes').check();
  await next(page);

  await heading(page, 'Receipts');
  await page.getByTestId('evidence-input').setInputFiles([
    { name: 'chat.jpg', mimeType: 'image/jpeg', buffer: await photo('#d23c8c', 'chat') },
    { name: 'cashapp.jpg', mimeType: 'image/jpeg', buffer: await photo('#3cd28c', 'paid 250') },
  ]);
  const files = page.locator('.files__item');
  await expect(files).toHaveCount(2);
  await expect(files.filter({ hasText: /Uploaded/ })).toHaveCount(2, { timeout: 30_000 });
  await shot(page, '4-receipts');
  await axe(page);
  await next(page);

  await heading(page, 'Your story');
  await page
    .getByLabel('What happened?')
    .fill(
      'I paid a $250 deposit for a lace install. They stopped answering and deleted the page the next week.',
    );
  await page.getByRole('button', { name: 'Record voice note' }).click();
  await expect(page.getByText(/Recording, \d+ of 60 seconds/)).toBeVisible();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText(/Voice note, \d+ seconds/)).toBeVisible({ timeout: 30_000 });
  // "Saved" only appears once the server confirmed the autosave.
  await expect(page.getByRole('status').filter({ hasText: /^Saved$/ })).toBeVisible({
    timeout: 10_000,
  });
  await next(page);

  await heading(page, 'You and consent');
  for (const box of ['I am 18 or older.', 'Everything I shared is true', 'I agree to the Terms']) {
    await expect(page.getByLabel(new RegExp(box.replace('.', '\\.'))).first()).not.toBeChecked();
  }
  await next(page);
  await expect(
    page.getByText('You need to be 18 or older to send a report.').first(),
  ).toBeVisible();
  await page.getByLabel(/I am 18 or older/).check();
  await page.getByLabel(/Everything I shared is true/).check();
  await page.getByLabel(/I agree to the Terms and Privacy Policy/).check();
  await page.getByLabel('Anonymous only.').check();
  await shot(page, '6-consent');
  await next(page);

  await heading(page, 'Review');
  await expect(page.getByText('$TeeLacesDemo')).toBeVisible();
  await expect(page.getByText('2 files')).toBeVisible();
  await expect(page.getByText('Voice note attached')).toBeVisible();
  await shot(page, '7-review');
  await axe(page);
  await page.getByRole('button', { name: 'Send my report' }).click();

  await heading(page, 'Report received');
  const code = (await page.getByTestId('case-code').textContent())!.trim();
  const claim = (await page.getByTestId('claim-code').textContent())!.trim();
  expect(code).toMatch(/^RMMM-\d{2}-\d{4}$/);
  expect(claim).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  await expect(page.getByRole('link', { name: /reportfraud\.ftc\.gov/ })).toHaveAttribute(
    'href',
    'https://reportfraud.ftc.gov/',
  );
  await expect(page.getByRole('link', { name: /ic3\.gov/ })).toBeVisible();
  await shot(page, '8-done');
  await expect(
    page.getByRole('link', { name: 'How to dispute a Cash App payment' }),
  ).toHaveAttribute('href', '/resources/payment-disputes#cashapp');
  await axe(page);
  expect(errors).toEqual([]);

  // ---------- what the database holds ----------
  const [report] = await rest<ReportRow[]>(`reports?public_code=eq.${code}&select=*`);
  expect(report).toBeTruthy();
  expect(report!.reporter_id).toBeNull();
  expect(report!.contact_mode).toBe('anonymous');
  expect(report!.anon_claim_hash).toMatch(/^[0-9a-f]{64}$/);
  expect(report!.draft_token_hash).toBeNull();
  expect(report!.submitted_ip).toBe('198.18.0.40');
  expect([report!.consent_truth, report!.consent_terms, report!.age_confirmed]).toEqual([
    true,
    true,
    true,
  ]);
  expect([report!.amount_cents, report!.rail]).toEqual([25000, 'cashapp']);

  const idents = await rest<{ type: string; norm: string }[]>(
    `report_identifiers?report_id=eq.${report!.id}&select=type,norm&order=type`,
  );
  expect(idents).toEqual(
    expect.arrayContaining([
      { type: 'cashtag', norm: 'teelacesdemo' },
      { type: 'handle_ig', norm: 'teelaces.demo' },
      { type: 'name', norm: expect.stringContaining('tee laces') },
    ]),
  );

  const consents = await rest<{ consent: string; value: boolean; version: string }[]>(
    `consents_log?report_id=eq.${report!.id}&select=consent,value,version&order=consent`,
  );
  expect(consents.map((c) => [c.consent, c.value])).toEqual([
    ['report_age_18', true],
    ['report_contact', false],
    ['report_on_camera_anonymous_only', true],
    ['report_terms', true],
    ['report_truth', true],
  ]);
  expect(new Set(consents.map((c) => c.version))).toEqual(new Set(['2026-10-06']));

  // The worker cleans every file; then the report moves to triage.
  await expect
    .poll(
      async () =>
        (await rest<{ status: string }[]>(`reports?id=eq.${report!.id}&select=status`))[0]!.status,
      { timeout: 60_000 },
    )
    .toBe('triage');
  const media = await rest<MediaRow[]>(`media?report_id=eq.${report!.id}&select=*&order=kind`);
  expect(media.map((m) => [m.kind, m.upload_status, m.exif_stripped, m.voice_note])).toEqual([
    ['audio', 'ready', true, true],
    ['image', 'ready', true, false],
    ['image', 'ready', true, false],
  ]);
  const voice = media.find((m) => m.kind === 'audio')!;
  expect(voice.duration_ms).toBeGreaterThan(1000);
  expect(voice.duration_ms).toBeLessThan(61_000);
  for (const m of media.filter((x) => x.kind === 'image')) {
    expect(m.phash).not.toBeNull();
    const stored = await readFile(path.join(STORAGE, 'evidence', m.storage_path));
    const meta = await sharp(stored).metadata();
    expect(meta.exif).toBeUndefined();
    expect(stored.includes(Buffer.from('PhoneCo'))).toBe(false);
    expect(stored.includes(Buffer.from('Jane Reporter'))).toBe(false);
  }

  // ---------- claim code works, from a fresh browser ----------
  const other = await browser.newContext({
    extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.41' },
  });
  const p2 = await other.newPage();
  await decideConsent(p2);
  await p2.goto('/report/status');
  await p2.getByLabel('Case code').fill(code);
  await p2.getByLabel('Claim code').fill('AAAA-BBBB-CCCC');
  await p2.getByRole('button', { name: 'Check status' }).click();
  await expect(p2.getByText('Those codes do not match a report.')).toBeVisible();
  await p2.getByLabel('Claim code').fill(claim.toLowerCase());
  await p2.getByRole('button', { name: 'Check status' }).click();
  await expect(p2.getByRole('heading', { name: code })).toBeVisible();
  await expect(p2.getByText('In the queue. A person on our team will read it soon.')).toBeVisible();
  await expect(p2.getByText('3 files')).toBeVisible();
  // The claim is remembered in this browser only.
  await p2.reload();
  await expect(p2.getByRole('heading', { name: code })).toBeVisible();
  await other.close();
});

test('server strips EXIF even when the browser does not (direct API upload)', async ({
  request,
}) => {
  const draft = await request.post('/api/reports', { data: { category: 'not_delivered' } });
  expect(draft.status()).toBe(201);
  const { id } = (await draft.json()) as { id: string };
  const img = await photo('#8c3cd2', 'flyer');
  const slot = await request.post(`/api/reports/${id}/media`, {
    data: { mime: 'image/jpeg', bytes: img.length },
  });
  expect(slot.status()).toBe(201);
  const { media, upload } = (await slot.json()) as {
    media: { id: string };
    upload: { url: string; headers: Record<string, string> };
  };
  const put = await request.put(upload.url, { data: img, headers: upload.headers });
  expect(put.status()).toBe(200);
  // A forged token is refused.
  expect(
    (
      await request.put(
        upload.url.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A')),
        { data: img },
      )
    ).status(),
  ).toBe(403);
  const done = await request.post(`/api/reports/${id}/media/${media.id}/complete`);
  expect(done.status()).toBe(200);

  await expect
    .poll(
      async () =>
        (
          await rest<{ upload_status: string }[]>(`media?id=eq.${media.id}&select=upload_status`)
        )[0]!.upload_status,
      { timeout: 30_000 },
    )
    .toBe('ready');
  const [row] = await rest<MediaRow[]>(`media?id=eq.${media.id}&select=*`);
  const stored = await readFile(path.join(STORAGE, 'evidence', row!.storage_path));
  expect((await sharp(stored).metadata()).exif).toBeUndefined();
  expect(stored.includes(Buffer.from('PhoneCo'))).toBe(false);
  expect(row!.exif_stripped).toBe(true);

  // Someone else's browser cannot read or change this draft.
  const ctx = await (
    await import('@playwright/test')
  ).request.newContext({ baseURL: process.env.WEB_URL });
  expect((await ctx.get(`/api/reports/${id}`)).status()).toBe(404);
  expect((await ctx.patch(`/api/reports/${id}`, { data: { story: 'x' } })).status()).toBe(404);
  await ctx.dispose();
});

test('a file that lies about its type is rejected by the worker', async ({ request }) => {
  const draft = await request.post('/api/reports', { data: {} });
  const { id } = (await draft.json()) as { id: string };
  const fake = Buffer.from('<html><script>alert(1)</script></html>'.padEnd(2048, ' '));
  const slot = await request.post(`/api/reports/${id}/media`, {
    data: { mime: 'image/png', bytes: fake.length },
  });
  const { media, upload } = (await slot.json()) as {
    media: { id: string };
    upload: { url: string; headers: Record<string, string> };
  };
  await request.put(upload.url, { data: fake, headers: upload.headers });
  await request.post(`/api/reports/${id}/media/${media.id}/complete`);
  await expect
    .poll(
      async () =>
        (
          await rest<{ upload_status: string; reject_reason: string }[]>(
            `media?id=eq.${media.id}&select=upload_status,reject_reason`,
          )
        )[0],
      { timeout: 30_000 },
    )
    .toEqual({ upload_status: 'rejected', reject_reason: 'type_mismatch' });
  // Types we never accept are refused before upload.
  const exe = await request.post(`/api/reports/${id}/media`, {
    data: { mime: 'application/x-msdownload', bytes: 10 },
  });
  expect(exe.status()).toBe(422);
});

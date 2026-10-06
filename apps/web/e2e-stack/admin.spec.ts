import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { decideConsent } from '../e2e/helpers';
import { createUser, psql, sendReport, signIn, WEB } from './staff';

/**
 * SPEC 16 Phase 3 acceptance, against the real stack:
 *   an entity cannot become public with one approval; the flag timer is visible;
 *   a ban from a report blocks that IP immediately.
 */
async function axe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(
    r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}

const health = (ip: string, device?: string) =>
  fetch(`${WEB}/api/health`, {
    headers: { 'x-forwarded-for': ip, ...(device ? { 'x-rmmm-device': device } : {}) },
  }).then((r) => r.status);

test('only staff with 2FA reach the console', async ({ browser }) => {
  const anon = await browser.newPage();
  await anon.goto('/admin');
  await expect(anon).toHaveURL(/\/auth\?next=%2Fadmin/);
  await anon.close();

  const member = await browser.newContext();
  await signIn(member, createUser('member'));
  const mp = await member.newPage();
  const res = await mp.goto('/admin/reports');
  expect(res?.status()).toBe(404);
  const api = await mp.request.patch('/api/admin/reports/00000000-0000-0000-0000-000000000000', {
    data: { action: 'triage' },
  });
  expect(api.status()).toBe(404);
  await member.close();

  const noMfa = await browser.newContext();
  await signIn(noMfa, createUser('moderator'), 'aal1');
  const np = await noMfa.newPage();
  await np.goto('/admin');
  await expect(np).toHaveURL(/\/admin\/mfa\?next=/);
  expect(
    (
      await np.request.patch('/api/admin/reports/00000000-0000-0000-0000-000000000000', {
        data: { action: 'triage' },
      })
    ).status(),
  ).toBe(403);
  await noMfa.close();
});

test('a ban from a report blocks that IP and device immediately', async ({ browser }) => {
  const ip = '198.18.0.61';
  const device = 'e2e-device-to-ban';
  const report = await sendReport(ip, device);
  expect(await health(ip)).toBe(200);

  // Moderators see the source exists but cannot ban.
  const modCtx = await browser.newContext();
  await signIn(modCtx, createUser('moderator'));
  const mod = await modCtx.newPage();
  await decideConsent(mod);
  await mod.goto(`/admin/reports/${report.id}`);
  await expect(mod.getByText(/IP address recorded\. Device recorded\./)).toBeVisible();
  await expect(mod.getByText('Only admins can ban.')).toBeVisible();
  await modCtx.close();

  const ctx = await browser.newContext();
  await signIn(ctx, createUser('admin'));
  const page = await ctx.newPage();
  await decideConsent(page);
  await page.goto(`/admin/reports/${report.id}`);
  await expect(page.getByRole('heading', { level: 1, name: report.code })).toBeVisible();
  await axe(page);
  await page.getByLabel('Reason for the ban').fill('Fake reports from this source');
  await page.getByRole('button', { name: "Ban this reporter's IP and device" }).click();
  await expect(page.getByText(/Banned: IP address and device/)).toBeVisible();

  // Next request from that IP, or that device on another IP, is refused. Others are fine.
  expect(await health(ip)).toBe(403);
  expect(await health('198.18.0.99', device)).toBe(403);
  expect(await health('198.18.0.62')).toBe(200);
  // Audited under the admin, and the raw IP never reached the page.
  expect(
    Number(
      psql(
        `select count(*) from audit_log where target_type in ('ip_bans','device_bans') and action = 'insert' and meta::text like '%Fake reports%'`,
      ),
    ),
  ).toBe(2);
  expect(await page.content()).not.toContain(ip);
  await ctx.close();
});

test('an entity cannot become public with one approval', async ({ browser }) => {
  const report = await sendReport('198.18.0.63', 'e2e-device-entity', 'Two Person Demo Nails');
  const modCtx = await browser.newContext();
  await signIn(modCtx, createUser('moderator'));
  const mod = await modCtx.newPage();
  await decideConsent(mod);

  // Moderator approves the report with an excerpt, then creates the entity from it.
  await mod.goto(`/admin/reports/${report.id}`);
  await mod
    .getByLabel('Public excerpt')
    .fill('Paid a deposit for nails. The appointment never happened.');
  await mod.getByRole('button', { name: 'Approve report' }).click();
  await expect(mod.getByText('Approved', { exact: true }).first()).toBeVisible();
  await mod.getByLabel('Entity name').fill('Two Person Demo Nails');
  await mod.getByRole('button', { name: 'Create entity from this report' }).click();
  const link = mod.getByRole('link', { name: 'Two Person Demo Nails' });
  await expect(link).toBeVisible();
  await link.click();
  await expect(mod.getByRole('heading', { level: 1, name: 'Two Person Demo Nails' })).toBeVisible();
  await expect(mod.getByText('$TwoPersonDemoNails')).toBeVisible();

  await mod.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(mod.getByTestId('entity-status')).toHaveText('1 of 2 approvals');
  await mod.getByRole('button', { name: 'Make public' }).click();
  await expect(mod.getByRole('alert').filter({ hasText: 'Not yet' })).toContainText(
    'needs approval from a moderator and an editor',
  );
  await expect(mod.getByTestId('entity-status')).toHaveText('1 of 2 approvals');
  const entityUrl = mod.url();
  const entityId = entityUrl.split('/').pop()!;
  expect(psql(`select is_public from entities where id = '${entityId}'`)).toBe('f');
  await axe(mod);

  // A second moderator still is not enough.
  const mod2Ctx = await browser.newContext();
  await signIn(mod2Ctx, createUser('moderator'));
  const mod2 = await mod2Ctx.newPage();
  await mod2.goto(entityUrl);
  await mod2.getByRole('button', { name: 'Approve', exact: true }).click();
  await expect(mod2.getByTestId('entity-status')).toHaveText('2 of 2 approvals');
  await mod2.getByRole('button', { name: 'Make public' }).click();
  await expect(mod2.getByRole('alert').filter({ hasText: 'Not yet' })).toContainText(
    'needs approval from a moderator and an editor',
  );
  await mod2Ctx.close();

  // An editor's approval completes the rule.
  const edCtx = await browser.newContext();
  await signIn(edCtx, createUser('editor'));
  const ed = await edCtx.newPage();
  await ed.goto(entityUrl);
  await ed.getByRole('button', { name: 'Approve', exact: true }).click();
  await ed.getByRole('button', { name: 'Make public' }).click();
  await expect(ed.getByTestId('entity-status')).toHaveText('Public');
  expect(psql(`select is_public from entities where id = '${entityId}'`)).toBe('t');
  expect(
    psql(
      `select count(*) from audit_log where target_type = 'entity_approvals' and meta -> 'row' ->> 'entity_id' = '${entityId}'`,
    ),
  ).toBe('3');
  await modCtx.close();
  await edCtx.close();
});

test('flag deadlines are visible and counting', async ({ browser }) => {
  const reporter = createUser('member');
  psql(`delete from content_flags`);
  psql(
    `insert into content_flags (target_type, target_id, reason, details, reporter_id, created_at) values
       ('entity', gen_random_uuid(), 'personal_info', 'Shows my phone number', '${reporter}', now() - interval '20 hours'),
       ('report', gen_random_uuid(), 'inaccurate', 'This is not what happened', '${reporter}', now() - interval '26 hours 30 minutes')`,
  );
  const ctx = await browser.newContext();
  await signIn(ctx, createUser('moderator'));
  const page = await ctx.newPage();
  await decideConsent(page);
  await page.goto('/admin');
  await expect(page.getByText('2 open flags')).toBeVisible();
  await expect(page.getByText('1 past the 24-hour deadline')).toBeVisible();
  await page.goto('/admin/flags');
  const flags = page.getByTestId('flag');
  await expect(flags).toHaveCount(2);
  // Most urgent first: the overdue one.
  await expect(flags.nth(0).locator('time')).toHaveText(/^Overdue by 2h (29|30|31)m$/);
  await expect(flags.nth(1).locator('time')).toHaveText(/^Due in (3h 5\dm|4h 0m)$/);
  await axe(page);

  await flags.nth(0).getByLabel('Action taken').selectOption('no_action');
  await flags.nth(0).getByLabel('Note').fill('Checked against the receipts.');
  await flags.nth(0).getByRole('button', { name: 'Resolve' }).click();
  await expect(page.getByTestId('flag')).toHaveCount(1);
  expect(
    psql(
      `select count(*) from content_flags where resolved_at is not null and resolved_by is not null`,
    ),
  ).toBe('1');
  await ctx.close();
});

test('admin pages pass axe', async ({ browser }) => {
  const ctx = await browser.newContext();
  await signIn(ctx, createUser('admin'));
  const page = await ctx.newPage();
  await decideConsent(page);
  for (const path of [
    '/admin',
    '/admin/reports',
    '/admin/entities',
    '/admin/disputes',
    '/admin/bans',
    '/admin/audit',
  ]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await axe(page);
  }
  await ctx.close();
});

test('a business dispute reaches the inbox with a 7-day deadline and gets an outcome', async ({
  browser,
}) => {
  const slug = `dispute-demo-${Date.now()}`;
  psql(
    `insert into entities (slug, display_name, is_public) values ('${slug}', 'Dispute Demo Lashes', true)`,
  );
  const send = (entitySlug: string) =>
    fetch(`${WEB}/api/disputes`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '198.18.0.70' },
      body: JSON.stringify({
        entitySlug,
        name: 'Owner Demo',
        email: 'owner@lashes.demo',
        body: 'We refunded this customer on Oct 2. Receipt attached by email.',
      }),
    });
  expect((await send('no-such-entity')).status).toBe(404);
  expect((await send(slug)).status).toBe(201);

  const ctx = await browser.newContext();
  await signIn(ctx, createUser('editor'));
  const page = await ctx.newPage();
  await decideConsent(page);
  await page.goto('/admin/disputes');
  const card = page.locator('.admin-card').filter({ hasText: 'Dispute Demo Lashes' });
  await expect(card.locator('time')).toHaveText(/^Due in 167h \d+m$/);
  await card.getByLabel('Outcome').selectOption('annotated');
  await card.getByRole('button', { name: 'Resolve' }).click();
  await expect(card.getByText('Business response added')).toBeVisible();
  expect(
    psql(`select status || ':' || outcome from disputes where contact_email = 'owner@lashes.demo'`),
  ).toBe('resolved:annotated');
  await ctx.close();
});

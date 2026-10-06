// SPEC 16 Phase 1 acceptance, end to end against a real stack:
//   banned IP gets 403 on every route; staff writes through the API create audit rows;
//   banned IPs cannot write through the API directly either.
// Run via scripts/e2e/security.sh (it starts Postgres, PostgREST, the gateway and Next).
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { sign } from './jwt.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:3311';
const API = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const SECRET = process.env.JWT_SECRET;
const BANNED = '203.0.113.77';
const CLEAN = '198.18.0.9';

const psql = (sql) =>
  execFileSync('psql', ['-X', '-q', '-t', '-A', '-v', 'ON_ERROR_STOP=1', '-c', sql], {
    encoding: 'utf8',
  }).trim();

const get = (route, ip, method = 'GET') =>
  fetch(WEB + route, { method, redirect: 'manual', headers: { 'x-forwarded-for': ip } });

/**
 * Every route: app routes from the build manifest, dynamic pages expanded through the live
 * sitemap, every public file, a static chunk and a page that does not exist.
 */
async function allRoutes() {
  const next = path.join(ROOT, 'apps/web/.next');
  const appRoutes = Object.values(
    JSON.parse(fs.readFileSync(path.join(next, 'app-path-routes-manifest.json'), 'utf8')),
  );
  const routes = new Set();
  for (const r of appRoutes) if (!r.includes('[') && !r.startsWith('/_')) routes.add(r);
  const sitemap = await (await get('/sitemap.xml', CLEAN)).text();
  for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) routes.add(new URL(m[1]).pathname);
  const pub = path.join(ROOT, 'apps/web/public');
  const walk = (d) =>
    fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else routes.add('/' + path.relative(pub, p).split(path.sep).join('/'));
    });
  walk(pub);
  const chunk = fs.readdirSync(path.join(next, 'static/chunks')).find((f) => f.endsWith('.js'));
  if (chunk) routes.add(`/_next/static/chunks/${chunk}`);
  routes.add('/does-not-exist');
  return [...routes].sort();
}

test('banned IP gets 403 on every route; others do not', async () => {
  const routes = await allRoutes();
  assert.ok(routes.length > 20, `expected many routes, got ${routes.length}`);
  assert.ok(
    routes.includes('/api/health') &&
      routes.includes('/styleguide') &&
      routes.includes('/legal/privacy'),
  );

  psql(
    `delete from public.ip_bans; insert into public.ip_bans (cidr, reason) values ('203.0.113.0/24', 'e2e');`,
  );
  for (const r of routes) {
    const banned = await get(r, BANNED);
    assert.equal(banned.status, 403, `banned ${r}`);
    const clean = await get(r, CLEAN);
    assert.notEqual(clean.status, 403, `clean ${r}`);
    assert.ok(clean.status < 500, `clean ${r} -> ${clean.status}`);
  }
  // Mutating methods too.
  assert.equal((await get('/api/health', BANNED, 'POST')).status, 403);
  console.log(`  checked ${routes.length} routes`);
});

test('ban takes effect immediately and lifts immediately (cache TTL 0 in E2E)', async () => {
  psql(`delete from public.ip_bans;`);
  assert.equal((await get('/', BANNED)).status, 200);
  psql(`insert into public.ip_bans (cidr, reason) values ('${BANNED}/32', 'e2e');`);
  assert.equal((await get('/', BANNED)).status, 403);
  psql(`update public.ip_bans set expires_at = now() - interval '1 second';`);
  assert.equal((await get('/', BANNED)).status, 200);
});

test('rate limiter (Postgres token bucket) returns 429 after 30 searches/min', async () => {
  psql(`delete from public.ip_bans; delete from public.rate_limits;`);
  const ip = '198.18.5.5';
  for (let i = 0; i < 30; i++)
    assert.notEqual((await get('/api/search?q=x', ip)).status, 429, `request ${i + 1}`);
  const res = await get('/api/search?q=x', ip);
  assert.equal(res.status, 429);
  assert.ok(Number(res.headers.get('retry-after')) >= 1);
});

test('staff write through the API creates an audit row with actor and IP', async () => {
  const admin = psql(`select tests.create_user('admin')`);
  const token = sign({ sub: admin, role: 'authenticated', aal: 'aal2' }, SECRET);
  const res = await fetch(`${API}/rest/v1/ip_bans`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      prefer: 'return=minimal',
      'x-forwarded-for': '192.0.2.44',
    },
    body: JSON.stringify({ cidr: '100.64.0.0/10', reason: 'e2e audit' }),
  });
  assert.equal(res.status, 201, await res.text());
  const row = psql(
    `select actor || '|' || action || '|' || host(ip) from public.audit_log where target_type = 'ip_bans' and meta->'row'->>'reason' = 'e2e audit'`,
  );
  assert.equal(row, `${admin}|insert|192.0.2.44`);

  // Same admin without 2FA (aal1) is refused.
  const weak = sign({ sub: admin, role: 'authenticated', aal: 'aal1' }, SECRET);
  const denied = await fetch(`${API}/rest/v1/ip_bans`, {
    method: 'POST',
    headers: { authorization: `Bearer ${weak}`, 'content-type': 'application/json' },
    body: JSON.stringify({ cidr: '100.64.0.1', reason: 'nope' }),
  });
  assert.equal(denied.status, 403);
});

test('banned IP cannot write through the API even without the web proxy', async () => {
  psql(`delete from public.ip_bans; insert into public.ip_bans (cidr) values ('203.0.113.0/24');`);
  const member = psql(`select tests.create_user('member')`);
  const token = sign({ sub: member, role: 'authenticated', aal: 'aal1' }, SECRET);
  const post = (ip) =>
    fetch(`${API}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({ reporter_id: member, status: 'draft' }),
    });
  assert.equal((await post(BANNED)).status, 403);
  assert.equal((await post(CLEAN)).status, 201);
});

test('anon API key cannot read private tables or call service RPCs', async () => {
  const anon = sign({ role: 'anon' }, SECRET);
  const h = { apikey: anon, authorization: `Bearer ${anon}` };
  for (const t of ['reports', 'profiles', 'media', 'ip_bans', 'consents_log']) {
    const res = await fetch(`${API}/rest/v1/${t}?select=*`, { headers: h });
    assert.deepEqual(await res.json(), [], t);
  }
  const audit = await fetch(`${API}/rest/v1/audit_log?select=*`, { headers: h });
  assert.equal(audit.status, 401);
  const rpc = await fetch(`${API}/rest/v1/rpc/is_banned`, {
    method: 'POST',
    headers: { ...h, 'content-type': 'application/json' },
    body: JSON.stringify({ ip: '1.1.1.1' }),
  });
  assert.ok([401, 403, 404].includes(rpc.status), `is_banned as anon -> ${rpc.status}`);
});

test('contact form round trip: validated, rate limited, stored with hashes only', async () => {
  psql(
    `delete from public.ip_bans; delete from public.rate_limits; delete from public.contact_messages;`,
  );
  const ip = '198.18.9.9';
  const post = (body, headers = {}) =>
    fetch(`${WEB}/api/contact`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers },
      body: JSON.stringify(body),
    });
  const good = {
    reason: 'press',
    name: 'Dee Demo',
    email: 'dee@example.demo',
    message: 'Hello team, this is a real test message.',
  };

  const bad = await post({ ...good, email: 'nope' });
  assert.equal(bad.status, 422);
  assert.deepEqual(Object.keys((await bad.json()).fields), ['email']);

  const cross = await post(good, {
    origin: 'https://evil.example',
    'sec-fetch-site': 'cross-site',
  });
  assert.equal(cross.status, 403);

  const ok = await post(good);
  assert.equal(ok.status, 201);
  const { ref } = await ok.json();
  assert.match(ref, /^[0-9A-F]{8}$/);
  const row = psql(
    `select reason || '|' || (ip_hash ~ '^[0-9a-f]{64}$') || '|' || (ip_hash <> '${ip}') from public.contact_messages where public_ref = '${ref}'`,
  );
  assert.equal(row, 'press|true|true', 'stored with a hashed IP, never the raw IP');

  // 5 per hour per IP: the bucket is now at 2 used (422 and 201; the 403 was refused before it).
  let last;
  for (let i = 0; i < 5; i++) last = await post(good);
  assert.equal(last.status, 429);
});

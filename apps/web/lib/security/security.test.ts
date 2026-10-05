import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import { StaticBanStore, type BanStore } from './bans';
import { clientIp, deviceHash, DEVICE_COOKIE, DEVICE_HEADER } from './client';
import { createSecurityProxy } from './proxy';
import { MemoryRateLimiter, ruleFor } from './rate-limit';
import { TtlCache } from './ttl-cache';

const req = (
  path: string,
  init: { ip?: string; method?: string; headers?: Record<string, string> } = {},
) =>
  new NextRequest(`https://rmmm.test${path}`, {
    method: init.method ?? 'GET',
    headers: { ...(init.ip ? { 'x-forwarded-for': `${init.ip}, 10.0.0.1` } : {}), ...init.headers },
  });

describe('clientIp', () => {
  it.each([
    ['203.0.113.7', '203.0.113.7'],
    ['203.0.113.7, 10.0.0.1', '203.0.113.7'],
    ['203.0.113.7:51234', '203.0.113.7'],
    ['[2001:db8::1]:443', '2001:db8::1'],
    ['2001:db8::1', '2001:db8::1'],
    ['not-an-ip', null],
    ['', null],
  ])('%j -> %j', (header, want) => {
    expect(clientIp(new Headers(header ? { 'x-forwarded-for': header } : {}))).toBe(want);
  });

  it('honors a custom header', () => {
    expect(clientIp(new Headers({ 'cf-connecting-ip': '198.51.100.4' }), 'cf-connecting-ip')).toBe(
      '198.51.100.4',
    );
  });
});

describe('deviceHash', () => {
  it('is stable, namespaced and hex', async () => {
    const a = await deviceHash('app', 'install-1');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await deviceHash('app', 'install-1')).toBe(a);
    expect(await deviceHash('web', 'install-1')).not.toBe(a);
    expect(await deviceHash('web', null)).toBeNull();
  });
});

describe('rate rules (SPEC 9)', () => {
  it.each([
    ['/api/search', 'GET', 'search'],
    ['/api/search/image', 'POST', 'search'],
    ['/api/reports/abc/submit', 'POST', 'report-submit'],
    ['/api/reports/abc/media', 'POST', 'report-media'],
    ['/api/reports/claim', 'POST', 'report-claim'],
    ['/api/reports', 'POST', 'report-write'],
    ['/api/flags', 'POST', 'flags'],
    ['/api/privacy/delete', 'POST', 'privacy'],
    ['/api/cases', 'GET', 'api'],
  ])('%s %s -> %s', (path, method, name) => {
    expect(ruleFor(path, method)?.name).toBe(name);
  });
  it('search is 30/min', () =>
    expect(ruleFor('/api/search', 'GET')).toMatchObject({ capacity: 30, refillPerMinute: 30 }));
  it('pages are not rate limited', () => expect(ruleFor('/cases/x', 'GET')).toBeUndefined());
});

describe('security proxy', () => {
  const banned = new StaticBanStore(new Set(['203.0.113.7']));
  const proxy = createSecurityProxy({
    bans: banned,
    limiter: new MemoryRateLimiter(),
    clientIpHeader: 'x-forwarded-for',
  });

  it.each([
    '/',
    '/styleguide',
    '/legal/privacy',
    '/brand/app-icon.svg',
    '/_next/static/chunk.js',
    '/api/health',
  ])('banned IP gets 403 on %s', async (path) => {
    const res = await proxy(req(path, { ip: '203.0.113.7' }));
    expect(res.status).toBe(403);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('API 403 is JSON, page 403 is text', async () => {
    expect(await (await proxy(req('/api/health', { ip: '203.0.113.7' }))).json()).toMatchObject({
      error: 'forbidden',
    });
    expect(await (await proxy(req('/', { ip: '203.0.113.7' }))).text()).toMatch(/blocked/);
  });

  it('other IPs pass', async () => {
    const res = await proxy(req('/', { ip: '203.0.113.8' }));
    expect(res.status).toBe(200);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  });

  it('bans by app device header', async () => {
    const hash = await deviceHash('app', 'evil-install');
    const p = createSecurityProxy({
      bans: new StaticBanStore(new Set(), new Set([hash!])),
      limiter: null,
      clientIpHeader: 'x-forwarded-for',
    });
    expect(
      (await p(req('/api/health', { ip: '1.1.1.1', headers: { [DEVICE_HEADER]: 'evil-install' } })))
        .status,
    ).toBe(403);
    expect(
      (await p(req('/api/health', { ip: '1.1.1.1', headers: { [DEVICE_HEADER]: 'good-install' } })))
        .status,
    ).toBe(200);
  });

  it('bans by web device cookie', async () => {
    const hash = await deviceHash('web', 'cookie-id');
    const p = createSecurityProxy({
      bans: new StaticBanStore(new Set(), new Set([hash!])),
      limiter: null,
      clientIpHeader: 'x-forwarded-for',
    });
    const r = req('/', { ip: '1.1.1.1' });
    r.cookies.set(DEVICE_COOKIE, 'cookie-id');
    expect((await p(r)).status).toBe(403);
  });

  it('sets a device cookie for new web visitors only', async () => {
    const res = await proxy(req('/', { ip: '1.2.3.4' }));
    const c = res.cookies.get(DEVICE_COOKIE);
    expect(c?.value).toMatch(/^[0-9a-f-]{36}$/);
    expect(c?.httpOnly).toBe(true);
    const app = await proxy(req('/', { ip: '1.2.3.4', headers: { [DEVICE_HEADER]: 'x' } }));
    expect(app.cookies.get(DEVICE_COOKIE)).toBeUndefined();
  });

  it('rate limits search at 30/min per IP with Retry-After', async () => {
    const p = createSecurityProxy({
      bans: null,
      limiter: new MemoryRateLimiter(() => 0),
      clientIpHeader: 'x-forwarded-for',
    });
    for (let i = 0; i < 30; i++)
      expect((await p(req('/api/search?q=x', { ip: '9.9.9.9' }))).status).toBe(200);
    const limited = await p(req('/api/search?q=x', { ip: '9.9.9.9' }));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThanOrEqual(1);
    expect((await p(req('/api/search?q=x', { ip: '9.9.9.10' }))).status).toBe(200);
  });

  it('fails open (and logs) when the ban store is down', async () => {
    const log = vi.fn();
    const broken: BanStore = { isBanned: () => Promise.reject(new Error('db down')) };
    const p = createSecurityProxy({
      bans: broken,
      limiter: null,
      clientIpHeader: 'x-forwarded-for',
      log,
    });
    expect((await p(req('/', { ip: '203.0.113.7' }))).status).toBe(200);
    expect(log).toHaveBeenCalled();
  });
});

describe('TtlCache', () => {
  it('expires entries and can be disabled', () => {
    let t = 0;
    const c = new TtlCache<boolean>(1000, 10, () => t);
    c.set('a', true);
    expect(c.get('a')).toBe(true);
    t = 1001;
    expect(c.get('a')).toBeUndefined();
    const off = new TtlCache<boolean>(0);
    off.set('a', true);
    expect(off.get('a')).toBeUndefined();
  });
});

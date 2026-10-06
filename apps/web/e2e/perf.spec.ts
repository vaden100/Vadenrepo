import { expect, test } from '@playwright/test';
import { decideConsent } from './helpers';

/**
 * WBS 74, 75: lab budget on a throttled "slow 4G, 4x CPU" profile. Real-user monitoring
 * after launch is the source of truth; this catches regressions before merge.
 */
test('home: LCP < 2.5s, CLS < 0.1, JS within budget on a slow profile', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'CDP throttling');
  await decideConsent(page);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((l) => {
      for (const e of l.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[]) {
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver((l) => {
      const last = l.getEntries().at(-1);
      if (last) (window as unknown as { __lcp: number }).__lcp = last.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.mouse.click(5, 5); // finalizes LCP
  const { lcp, cls, jsBytes } = await page.evaluate(() => ({
    lcp: (window as unknown as { __lcp: number }).__lcp,
    cls: (window as unknown as { __cls: number }).__cls,
    // Bytes on the wire (compressed) for every script, from Resource Timing.
    jsBytes: (performance.getEntriesByType('resource') as PerformanceResourceTiming[])
      .filter((e) => e.name.endsWith('.js'))
      .reduce((sum, e) => sum + e.encodedBodySize, 0),
  }));
  console.log(
    `LCP ${Math.round(lcp)}ms, CLS ${cls.toFixed(3)}, JS ${(jsBytes / 1024).toFixed(0)} KB on the wire`,
  );
  expect(lcp).toBeLessThan(2500);
  expect(cls).toBeLessThan(0.1);
  // Budget (docs/operations.md): <= 170 KB gzipped JS on home. Next.js + React alone are ~117 KB.
  expect(jsBytes).toBeLessThan(170 * 1024);
});

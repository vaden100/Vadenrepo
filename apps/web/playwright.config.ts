import { defineConfig, devices } from '@playwright/test';

/**
 * Browser E2E (WBS 95 to 98). Runs against a production build (`pnpm build:e2e`, which turns
 * on an analytics provider so consent paths are exercised) served by `next start`.
 * Set PW_CHROMIUM_PATH to use a preinstalled Chromium instead of `playwright install`.
 */
const PORT = 3400;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
    // Every request carries a test IP so the proxy's per-IP rate limits apply per worker.
    extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.10' },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /visual|perf/ },
    ...(process.env.PW_ALL_BROWSERS
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /visual|perf/ },
          { name: 'webkit', use: { ...devices['iPhone 13'] }, testIgnore: /visual|perf/ },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

import { defineConfig, devices } from '@playwright/test';

/**
 * Browser tests against a production build (`pnpm build` then `next start`).
 * PW_CHROMIUM_PATH points at a preinstalled Chromium instead of `playwright install`.
 * PW_ALL_BROWSERS=1 adds Firefox and WebKit (SPEC 15.1).
 */
const PORT = 3400;
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ...(process.env.PW_ALL_BROWSERS
      ? [
          { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit', use: { ...devices['iPhone 13'] } },
        ]
      : []),
  ],
  webServer: {
    command: `pnpm exec next start -p ${PORT} -H 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { SITE_URL: `http://127.0.0.1:${PORT}` },
  },
});

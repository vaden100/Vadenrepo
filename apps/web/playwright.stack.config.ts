import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack browser tests (SPEC 16 Phase 2 acceptance). Started by scripts/e2e/security.sh,
 * which runs Postgres, PostgREST, Next and the media worker; nothing is mocked.
 */
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e-stack',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: process.env.WEB_URL ?? 'http://127.0.0.1:3311',
    trace: 'retain-on-failure',
    permissions: ['microphone', 'clipboard-read', 'clipboard-write'],
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      // A fake microphone (a tone) so the voice note is recorded for real by MediaRecorder.
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
    },
    extraHTTPHeaders: { 'x-forwarded-for': '198.18.0.40' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
  ],
});

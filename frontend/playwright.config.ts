import { defineConfig, devices } from '@playwright/test';

const PORT = 5180;

/**
 * Browser smoke tests for the admin console. The SPA is served under the `/console/` base
 * (Vite) and talks to the API over relative paths; specs stub network via `page.route`, so no
 * live backend is needed. Run `npx playwright install chromium` once before `npm run e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'ja-JP',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx vite --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}/console/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

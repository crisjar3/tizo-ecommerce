import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-official',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-official' }]],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-AR',
    ...devices['Desktop Chrome'],
    viewport: { width: 1280, height: 1024 },
  },
  webServer: {
    command: 'pnpm start --host localhost --port 4200',
    url: 'http://localhost:4200/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

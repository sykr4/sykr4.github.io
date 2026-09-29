import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 90_000,
  expect: { timeout: 12_000 },
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'docs/qa/browser-results.json' }]],
  use: { baseURL: process.env.QA_BASE_URL || 'http://127.0.0.1:4175', viewport: { width: 1280, height: 720 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', launchOptions: { args: ['--enable-unsafe-swiftshader'], ignoreDefaultArgs: ['--hide-scrollbars'] } } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
  webServer: process.env.QA_BASE_URL ? undefined : { command: 'npm run dev -- --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175', reuseExistingServer: true },
});

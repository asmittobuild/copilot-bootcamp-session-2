const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'PORT=3030 npm run start:backend',
      url: 'http://localhost:3030',
      timeout: 120000,
      reuseExistingServer: true,
    },
    {
      command: 'PORT=3000 npm run start:frontend',
      url: 'http://localhost:3000',
      timeout: 120000,
      reuseExistingServer: true,
    },
  ],
});

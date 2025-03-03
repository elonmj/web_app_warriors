import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  // Use chromium browser
  use: {
    browserName: 'chromium',
    // Run browser in headless mode by default
    headless: true,
    // Set viewport size
    viewport: { width: 1280, height: 720 },
    // Set a reasonable timeout
    navigationTimeout: 30000,
  },
  timeout: 30000,
  // Retry failed tests
  retries: 1,
  // Workers
  workers: 1,
};

export default config;

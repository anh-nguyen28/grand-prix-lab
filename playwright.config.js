import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 360000,
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1440, height: 1100 }, headless: true, reducedMotion: 'reduce', screenshot: 'only-on-failure', launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: 'npm run dev', url: 'http://127.0.0.1:4174', reuseExistingServer: true, timeout: 20000 },
  reporter: 'list',
});

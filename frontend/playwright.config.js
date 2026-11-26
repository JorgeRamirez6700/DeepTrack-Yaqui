import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 12_000 },
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'mvn --batch-mode --no-transfer-progress spring-boot:run',
      cwd: fileURLToPath(new URL('../backend', import.meta.url)),
      url: 'http://localhost:8080/api/auth/csrf',
      timeout: 180_000,
      reuseExistingServer: false,
      env: {
        SPRING_PROFILES_ACTIVE: 'dev',
        SPRING_DATASOURCE_URL: 'jdbc:h2:mem:deeptrack_e2e;DB_CLOSE_DELAY=-1',
        SPRING_JPA_HIBERNATE_DDL_AUTO: 'create-drop',
        DEEPTRACK_COOKIE_SECURE: 'false',
      },
    },
    {
      command: 'npm run dev -- --host localhost --strictPort',
      url: 'http://localhost:5173',
      timeout: 120_000,
      reuseExistingServer: false,
      env: { VITE_GOOGLE_MAPS_API_KEY: '', VITE_API_URL: '' },
    },
  ],
});

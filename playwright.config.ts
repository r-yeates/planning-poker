import { defineConfig, devices } from '@playwright/test';

// Everything runs against the Firebase emulators (demo- project id), never your real project.
const PROJECT_ID = 'demo-sprintro';
const CORE_PORT = 3100; // default feature flags
const FEATURES_PORT = 3101; // ticket entry, backlog, final estimates and session summary on

const appEnv = (distDir: string, flags: Record<string, string>) => ({
  // Separate build directories so the servers don't fight over a lock with each other or your `next dev`
  NEXT_DIST_DIR: distDir,
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR: 'true',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
  FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080',
  FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9099',
  ...flags,
});

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Playwright defaults to half the CPUs, which overloads the shared dev servers and emulators and causes page-load timeouts
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { ...devices['Desktop Chrome'], trace: 'retain-on-failure' },
  projects: [
    { name: 'unit', testMatch: /unit[\\/].*\.spec\.ts/ },
    {
      name: 'core',
      testIgnore: [/unit[\\/]/, /features[\\/]/],
      use: { baseURL: `http://localhost:${CORE_PORT}` },
    },
    {
      name: 'features',
      testMatch: /features[\\/].*\.spec\.ts/,
      use: { baseURL: `http://localhost:${FEATURES_PORT}` },
    },
  ],
  webServer: [
    {
      command: `npx firebase emulators:start --only auth,firestore --project ${PROJECT_ID}`,
      // Both emulators must be up before the app starts
      wait: { stdout: /All emulators ready/ },
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx next dev -p ${CORE_PORT}`,
      url: `http://localhost:${CORE_PORT}`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: appEnv('.next-e2e', {
        NEXT_PUBLIC_FEATURE_TICKET_ENTRY: 'false',
        NEXT_PUBLIC_FEATURE_FINAL_ESTIMATES: 'false',
      }),
    },
    {
      command: `npx next dev -p ${FEATURES_PORT}`,
      url: `http://localhost:${FEATURES_PORT}`,
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      env: appEnv('.next-e2e-features', {
        NEXT_PUBLIC_FEATURE_TICKET_ENTRY: 'true',
        NEXT_PUBLIC_FEATURE_BACKLOG: 'true',
        NEXT_PUBLIC_FEATURE_FINAL_ESTIMATES: 'true',
        NEXT_PUBLIC_FEATURE_SESSION_SUMMARY: 'true',
      }),
    },
  ],
});

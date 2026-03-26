import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.PROJECT_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects and dependency order */
    projects: [
        {
            name: 'setup',
            testMatch: '**/setup.spec.ts',
        },
        {
            name: 'auth',
            testMatch: '**/auth.spec.ts',
            dependencies: ['setup'],
        },
        {
            name: 'access-management',
            testMatch: '**/access-management.spec.ts',
            dependencies: ['auth'],
        },
        {
            name: 'notification',
            testMatch: '**/notification/**/*.spec.ts',
            dependencies: ['access-management'],
        },
        {
            name: 'storage',
            testMatch: '**/storage/**/*.spec.ts',
            dependencies: ['access-management'],
        },
        {
            name: 'agent',
            testMatch: '**/agent.spec.ts',
            dependencies: ['access-management'],
        },

        {
            name: 'project',
            testMatch: '**/project.spec.ts',
            dependencies: ['access-management'],
        },
        {
            name: 'cleanup',
            testMatch: '**/cleanup.spec.ts',
            dependencies: ['agent', 'storage', 'notification', 'project'],
        },
    ]
    
});

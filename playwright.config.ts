import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:5173';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: [['html', { open: 'never' }]],
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
		// N-4: the app must be usable on a lower-resolution device.
		{ name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
	],
	/**
	 * MSW in the browser, never the real API (ADR-0003).
	 *
	 * `reuseExistingServer` is off deliberately. Reusing whatever holds the port means a plain
	 * `pnpm dev` left running - no MSW - is silently adopted, and the whole suite then runs against
	 * the live API with the test token: every request 401s, the session is rejected and all 66
	 * specs fail on the login screen, with nothing saying why. Starting the server here makes
	 * Playwright fail loudly on a busy port instead, and keeps the ADR-0003 guarantee true rather
	 * than conditional on what else happens to be running.
	 */
	webServer: {
		command: 'pnpm dev:mock',
		url: baseURL,
		reuseExistingServer: false,
	},
});

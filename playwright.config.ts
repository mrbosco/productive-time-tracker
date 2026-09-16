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
	// MSW in the browser, never the real API (ADR-0003).
	webServer: {
		command: 'pnpm dev:mock',
		url: baseURL,
		reuseExistingServer: !process.env.CI,
	},
});

import { expect, type Page, test } from '@playwright/test';

/**
 * Logging in, on both projects (desktop and Pixel 5): the login screen, the session surviving a
 * refresh, and logout clearing it.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock`, never the real API (ADR-0003). That
 * worker has no per-test override, so the rejected-token and wrong-organization messages are
 * covered by the component tests, which can install those handlers.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/**
 * Where a logged-in visitor lands: `/` redirects to today's day view, and "today" is
 * whatever day the suite runs on. Matching the shape rather than recomputing the date keeps this
 * from re-implementing `lib/date` in a file that compiles without the DOM lib.
 */
// No leading anchor: `toHaveURL` matches a regex against the whole URL, origin included.
const DAY_URL = /\/day\/\d{4}-\d{2}-\d{2}$/;

async function logIn(page: Page) {
	await page.getByLabel('API token').fill('test-token');
	await page.getByLabel('Organization ID').fill('999999');
	await page.getByRole('button', { name: 'Log in' }).click();
}

/**
 * Read through Playwright's storage state rather than `page.evaluate`: the e2e project compiles
 * without the DOM lib (it shares `tsconfig.node.json` with the config files), so `window` has no
 * type in here.
 */
async function readStoredSession(page: Page) {
	const { origins } = await page.context().storageState();

	return origins.flatMap((origin) => origin.localStorage).find((entry) => entry.name === SESSION_STORAGE_KEY);
}

test.describe('login and session', { tag: '@mobile' }, () => {
	test('sends a visitor with no session to the login screen', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL('/login');
		await expect(page.getByRole('heading', { name: 'Productive Time Tracker' })).toBeVisible();
	});

	test('logs in and lands on the day screen', async ({ page }) => {
		await page.goto('/login');

		await logIn(page);

		await expect(page).toHaveURL(DAY_URL);
		await expect(page.getByRole('heading', { level: 1, name: /^Today, / })).toBeVisible();
	});

	test('stays logged in across a refresh', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL(DAY_URL);
		const landed = page.url();

		await page.reload();

		await expect(page).toHaveURL(landed);
		await expect(page.getByRole('heading', { level: 1, name: /^Today, / })).toBeVisible();
	});

	test('sends a logged-in visitor away from the login screen', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL(DAY_URL);

		await page.goto('/login');

		await expect(page).toHaveURL(DAY_URL);
	});

	test('logging out clears the stored credentials', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL(DAY_URL);

		await page.getByRole('button', { name: 'Account menu' }).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(page).toHaveURL('/login');
		expect(await readStoredSession(page)).toBeUndefined();

		// And the guard still holds, rather than the redirect having run once.
		await page.goto('/');
		await expect(page).toHaveURL('/login');
	});
});

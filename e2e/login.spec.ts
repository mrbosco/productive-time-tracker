import { expect, type Page, test } from '@playwright/test';

/**
 * US-0, on both projects (desktop and Pixel 5): the login screen, the session surviving a refresh,
 * and logout clearing it.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock`, never the real API (ADR-0003). That
 * worker has no per-test override, so the rejected-token and wrong-organization messages are
 * covered by the component tests, which can install those handlers.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

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

test.describe('login and session', () => {
	test('sends a visitor with no session to the login screen', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL('/login');
		await expect(page.getByRole('heading', { name: 'Productive Time Tracker' })).toBeVisible();
	});

	test('will not submit until both credentials are entered', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await page.getByLabel('API token').fill('test-token');
		await expect(page.getByRole('button', { name: 'Log in' })).toBeDisabled();

		await page.getByLabel('Organization ID').fill('999999');
		await expect(page.getByRole('button', { name: 'Log in' })).toBeEnabled();
	});

	test('reveals the token only when asked', async ({ page }) => {
		await page.goto('/login');

		await expect(page.getByLabel('API token')).toHaveAttribute('type', 'password');

		await page.getByRole('button', { name: 'Show token' }).click();

		await expect(page.getByLabel('API token')).toHaveAttribute('type', 'text');
	});

	test('logs in and lands on the day screen', async ({ page }) => {
		await page.goto('/login');

		await logIn(page);

		await expect(page).toHaveURL('/');
		await expect(page.getByRole('heading', { name: 'Time Tracker' })).toBeVisible();
		await expect(page.getByText('Logged in as Ada Lovelace')).toBeVisible();
		// A-1: resolved in the background after login, without the screen waiting on it.
		await expect(
			page.getByText('Default service: Example Agency · Administration · Acquiring new clients')
		).toBeVisible();
	});

	test('moves focus to the heading of the screen it navigates to', async ({ page }) => {
		await page.goto('/login');

		await logIn(page);

		// Without this a keyboard or screen-reader user is left on the submit button of a screen
		// that no longer exists, with nothing announcing the new one (guidebook 18).
		await expect(page.getByRole('heading', { name: 'Time Tracker' })).toBeFocused();
	});

	test('stays logged in across a refresh', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL('/');

		await page.reload();

		await expect(page).toHaveURL('/');
		await expect(page.getByText('Logged in as Ada Lovelace')).toBeVisible();
	});

	test('sends a logged-in visitor away from the login screen', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL('/');

		await page.goto('/login');

		await expect(page).toHaveURL('/');
	});

	test('logging out clears the stored credentials', async ({ page }) => {
		await page.goto('/login');
		await logIn(page);
		await expect(page).toHaveURL('/');

		await page.getByRole('button', { name: 'Account menu' }).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(page).toHaveURL('/login');
		expect(await readStoredSession(page)).toBeUndefined();

		// And the guard still holds, rather than the redirect having run once.
		await page.goto('/');
		await expect(page).toHaveURL('/login');
	});
});

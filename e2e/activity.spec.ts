import { expect, type Page, test } from '@playwright/test';

/**
 * The banner a running timer raises when nothing has happened for a while.
 *
 * Driven with Playwright's clock rather than a shortened threshold, because the fifteen minutes are
 * the product's number and a browser is the only place the whole chain can be exercised against it:
 * the `window` listeners, the visibility gate, the interval, and a banner that has to still be
 * there when the mouse arrives at its buttons.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

async function signIn(page: Page) {
	await page.addInitScript({
		content: `localStorage.setItem(${JSON.stringify(SESSION_STORAGE_KEY)}, ${JSON.stringify(
			JSON.stringify({
				token: 'test-token',
				organizationId: '999999',
				personId: '1448639',
				personName: 'Ada Lovelace',
			})
		)})`,
	});
}

/** A timer running on today, with the clock under the test's control from before the page loaded. */
async function startTimerWithControlledClock(page: Page) {
	await page.clock.install();
	await page.goto('/');
	await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);

	await page.getByRole('button', { name: 'Start timer' }).click();
	await expect(page.getByRole('banner').getByRole('button', { name: 'Stop timer' })).toBeVisible();
}

test.describe('activity awareness', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('warns once a running timer has been quiet for long enough', async ({ page }) => {
		await startTimerWithControlledClock(page);

		await page.clock.fastForward('16:00');

		await expect(page.getByText(/we have not seen activity/)).toBeVisible();
		// A choice, not an action: the timer is still running and nothing has been written.
		await expect(page.getByRole('banner').getByRole('button', { name: 'Stop timer' })).toBeVisible();
	});

	/** The subtraction is client-side and lands in the sheet, still correctable. */
	test('stops the timer and offers the tracked time less the idle minutes', async ({ page }) => {
		await startTimerWithControlledClock(page);
		await page.clock.fastForward('16:00');

		await page.getByRole('button', { name: 'Pause and discard idle time' }).click();

		const sheet = page.getByRole('dialog', { name: 'Save tracked time' });
		await expect(sheet).toBeVisible();
		await expect(sheet.getByText(/less .* idle/)).toBeVisible();
	});
});

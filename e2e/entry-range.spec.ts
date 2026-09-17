import { expect, type Page, test } from '@playwright/test';

/**
 * P-2 on both projects: logging an entry by naming when it started and when it ended.
 *
 * The happy path only. Which minutes a pair of times comes to, and what is said when the end is
 * before the start, are unit and component tests; what needs a browser is the native
 * `<input type="time">` - its value format is the whole contract `toMinutesOfDay` reads, and jsdom
 * does not implement the control.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day.json` was recorded for. */
const SEEDED_DATE = '2026-09-15';

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

test.describe('start and end range mode (P-2)', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	/*
	 * By role and accessible name, not `getByLabel`: that matches substrings, and "To" is inside
	 * "Totals by service" - the desktop card sitting right beside this form.
	 */
	test('logs an entry from a start and an end', async ({ page }) => {
		await page.goto(`/entries/new?date=${SEEDED_DATE}`);

		await page.getByRole('button', { name: 'Enter start and end instead' }).click();

		await page.getByRole('textbox', { name: 'From' }).fill('09:00');
		await page.getByRole('textbox', { name: 'To' }).fill('10:30');

		// The only confirmation before saving that the pair was read the way it was meant.
		await expect(page.getByText('= 1h 30m')).toBeVisible();

		await page.getByRole('button', { name: 'Save entry' }).click();

		await expect(page).toHaveURL(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('status')).toContainText('Entry saved');
		await expect(page.getByRole('article').filter({ hasText: '1h 30m' })).toBeVisible();
	});

	/** Only `time` is stored, so there is no range to reopen - the entry comes back as minutes. */
	test('reopens a ranged entry as a duration', async ({ page }) => {
		await page.goto(`/entries/new?date=${SEEDED_DATE}`);
		await page.getByRole('button', { name: 'Enter start and end instead' }).click();
		await page.getByRole('textbox', { name: 'From' }).fill('09:00');
		await page.getByRole('textbox', { name: 'To' }).fill('10:30');
		await page.getByRole('button', { name: 'Save entry' }).click();
		await expect(page).toHaveURL(`/day/${SEEDED_DATE}`);

		const saved = page.getByRole('article').filter({ hasText: '1h 30m' });
		await saved.getByRole('button', { name: 'Entry actions' }).click();
		await page.getByRole('menuitem', { name: 'Edit' }).click();

		await expect(page.getByRole('textbox', { name: 'Duration' })).toHaveValue('1h 30m');
		await expect(page.getByRole('textbox', { name: 'From' })).toBeHidden();
	});
});

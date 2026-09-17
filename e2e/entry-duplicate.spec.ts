import { expect, type Page, test } from '@playwright/test';

/**
 * X-3 on both projects: duplicating one entry, and filling an empty day from the one before it.
 *
 * The counting and the failure wording are component tests, which can install a handler that
 * refuses a POST. What needs a browser is the round trip through the URL - `Duplicate` puts the
 * entry's id in a search param, and the form on the other side has to read it back and open
 * prefilled.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day.json` was recorded for. */
const SEEDED_DATE = '2026-09-15';

/** The day after it: empty, and its yesterday is the recorded one. */
const EMPTY_DATE = '2026-09-16';

/**
 * The recorded day's only entry with a description: five hours, and a note written in Productive as
 * a bullet list. Addressed by that note rather than by position - which row it is depends on A-7's
 * ordering, and none of these tests are about that.
 */
const NOTED_ENTRY_DURATION = '5h';
const NOTED_ENTRY_NOTE = 'Probavam';

function notedEntry(page: Page) {
	return page.getByRole('article').filter({ hasText: NOTED_ENTRY_NOTE });
}

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

test.describe('duplicate and copy forward (X-3)', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('opens a new entry prefilled from the one it was duplicated from', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		const first = notedEntry(page);
		await expect(first).toContainText(NOTED_ENTRY_DURATION);
		await first.getByRole('button', { name: 'Entry actions' }).click();
		await page.getByRole('menuitem', { name: 'Duplicate' }).click();

		const form = page.getByRole('dialog', { name: 'New entry' });
		await expect(form).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Duration' })).toHaveValue('5h');
		await expect(form.getByText(NOTED_ENTRY_NOTE)).toBeVisible();
	});

	/** Toggl's continue pattern: the copy is about today, and the source day stays in the picker. */
	test('duplicates onto today rather than onto the day it came from', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await notedEntry(page).getByRole('button', { name: 'Entry actions' }).click();
		await page.getByRole('menuitem', { name: 'Duplicate' }).click();

		await expect(page).toHaveURL(/\/entries\/new\?date=\d{4}-\d{2}-\d{2}&duplicate=/);
		await expect(page).not.toHaveURL(new RegExp(`date=${SEEDED_DATE}`));
	});

	test('fills an empty day from the day before it', async ({ page }) => {
		await page.goto(`/day/${EMPTY_DATE}`);

		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
		await page.getByRole('button', { name: 'Copy from yesterday' }).click();

		await expect(page.getByRole('status')).toContainText('3 entries copied from yesterday');
		await expect(page.getByRole('article')).toHaveCount(3);
	});
});

import { expect, type Page, test } from '@playwright/test';

/**
 * US-3 on both projects: the form opens on the entry, saves what was changed, and the day behind it
 * reflects the change (R-11).
 *
 * Runs against the MSW worker booted by `pnpm dev:mock` (ADR-0003). The worker remembers the
 * attributes a PATCH changed for the length of a page session, which is what makes "list reflects
 * update" assertable here rather than only in a hook test. A reload clears that memory, so these
 * tests navigate rather than reload - including after a save, where the form lands on the day the
 * entry ended up on.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day.json` was recorded for. */
const SEEDED_DATE = '2026-09-15';
/** The day after it, where the date-change test moves an entry to. */
const NEXT_DATE = '2026-09-16';

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

/** From the day view, the way the design offers: the card's kebab menu. */
async function openEditForm(page: Page) {
	await page.goto(`/day/${SEEDED_DATE}`);
	await notedEntry(page).getByRole('button', { name: 'Entry actions' }).click();
	await page.getByRole('menuitem', { name: 'Edit' }).click();

	await expect(page).toHaveURL(/\/entries\/\d+\/edit$/);
	await expect(page.getByRole('dialog', { name: 'Edit entry' })).toBeVisible();
}

async function setDuration(page: Page, value: string) {
	await page.getByRole('textbox', { name: 'Duration' }).fill(value);
}

test.describe('editing a time entry', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('opens on the entry, prefilled (R-11)', async ({ page }) => {
		await openEditForm(page);

		await expect(page.getByRole('textbox', { name: 'Duration' })).toHaveValue('5h');
		await expect(page.getByRole('button', { name: /Date Tue 15 Sep 2026/ })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Save changes' })).toBeVisible();
	});

	/**
	 * The requirement in one test: change it, and the list behind it says so. Asserted on the card
	 * rather than on the form, because "list reflects update" is the half a mutation can get wrong.
	 */
	test('saves the new duration and shows it on the day (R-11)', async ({ page }) => {
		await openEditForm(page);

		await setDuration(page, '2h 15m');
		await page.getByRole('button', { name: 'Save changes' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('status')).toHaveText('Entry saved');
		// The edited row, found by its note: an edit does not change `created_at`, so it stays where
		// A-7 put it rather than moving to the top the way a new entry does.
		await expect(notedEntry(page)).toContainText('2h 15m');
		await expect(notedEntry(page)).not.toContainText(NOTED_ENTRY_DURATION);
	});

	/**
	 * The second open has to show what the first one saved. The entry is cached under
	 * `['time-entry', id]` and nothing subscribes to it, so a save that merely invalidated that key
	 * left the next open prefilled from before the edit - and saving that form reverted it.
	 */
	test('reopens on the saved values, not the ones from before the edit (R-11)', async ({ page }) => {
		await openEditForm(page);

		await setDuration(page, '2h 15m');
		await page.getByRole('button', { name: 'Save changes' }).click();
		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));

		// Through the menu again rather than back: a reload would clear what the worker remembers.
		await notedEntry(page).getByRole('button', { name: 'Entry actions' }).click();
		await page.getByRole('menuitem', { name: 'Edit' }).click();

		await expect(page.getByRole('textbox', { name: 'Duration' })).toHaveValue('2h 15m');
	});

	/**
	 * SPEC 4.2's "and the old date if the date was changed on edit", from the outside: the entry has
	 * to leave the day it was on, not merely appear on the new one. Navigated back with the date
	 * navigator rather than `goto`, which would reload and clear what the worker remembers.
	 */
	test('moves the entry to another day when the date changes (R-11)', async ({ page }) => {
		await openEditForm(page);

		await page.getByRole('button', { name: /Date Tue 15 Sep 2026/ }).click();
		await page.getByRole('button', { name: 'Wednesday, September 16th, 2026' }).click();
		await page.getByRole('button', { name: 'Save changes' }).click();

		// The day the entry ended up on, not the one the form was opened from.
		await expect(page).toHaveURL(new RegExp(`/day/${NEXT_DATE}$`));
		await expect(page.getByRole('article')).toHaveCount(1);

		await page.getByRole('button', { name: 'Previous day' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('article')).toHaveCount(2);
	});

	/**
	 * ADR-0010 exists so this story could not ship the loss it describes: a note written in
	 * Productive as a list has to arrive as a list and leave as one. Only assertable in a browser -
	 * ProseMirror needs `beforeinput`, which jsdom does not implement.
	 */
	test('round-trips a note written as a list without flattening it (ADR-0010)', async ({ page }) => {
		await openEditForm(page);

		const description = page.getByRole('textbox', { name: 'Description' });
		await expect(description.locator('ul li')).toHaveCount(1);
		await expect(description).toContainText('Probavam');

		await description.click();
		await page.keyboard.press('End');
		await page.keyboard.press('Enter');
		await page.keyboard.type('and a second line');
		await expect(description.locator('ul li')).toHaveCount(2);

		await page.getByRole('button', { name: 'Save changes' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(notedEntry(page).locator('ul li')).toHaveCount(2);
	});

	test('says so when the entry no longer exists, and offers the way back', async ({ page }) => {
		await page.goto('/entries/999999999/edit');

		await expect(page.getByText('This entry no longer exists.')).toBeVisible();

		await page.getByRole('link', { name: 'Go to today' }).click();

		await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);
	});

	/** Improvements 10: a form nobody changed is not a draft, so leaving it must not ask. */
	test('closes an unchanged form without asking', async ({ page }) => {
		await openEditForm(page);

		await page.getByRole('button', { name: 'Cancel' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('dialog', { name: 'Save your changes?' })).toHaveCount(0);
	});
});

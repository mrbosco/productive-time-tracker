import { expect, type Page, test } from '@playwright/test';

/**
 * Deleting an entry: it happens only after the question is answered, the row leaves the list, and
 * the totals around the list go with it.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock` (ADR-0003). The worker remembers which IDs
 * a DELETE removed for the length of a page session, which is what makes "removed from the list"
 * assertable after a refetch rather than only in the frame the row disappeared. A reload clears
 * that memory, so these tests navigate rather than reload.
 *
 * The failure path is not here: making the mock refuse would mean a seam in the app for a test to
 * reach through, and the behaviour is already proven where it lives - the restore in
 * `useDeleteTimeEntry.test.ts`, the toast in `DayView.test.tsx`, the form's banner in
 * `TimeEntryForm.test.tsx`.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day-service-context.json` was recorded for: three entries, 5h. */
const SEEDED_DATE = '2026-09-15';

/**
 * The recorded day's only entry with a description: five hours, and a note written in Productive as
 * a bullet list. Addressed by that note rather than by position - which row it is depends on the
 * day's ordering, and none of these tests are about that.
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

async function openSeededDay(page: Page) {
	await page.goto(`/day/${SEEDED_DATE}`);
	await expect(page.getByRole('article')).toHaveCount(3);
}

/** The way the design offers: the card's kebab menu. Assumes the day is already open. */
async function askToDelete(page: Page) {
	await notedEntry(page).getByRole('button', { name: 'Entry actions' }).click();
	await page.getByRole('menuitem', { name: 'Delete' }).click();

	await expect(page.getByRole('dialog', { name: 'Delete this entry?' })).toBeVisible();
}

async function openConfirmFromMenu(page: Page) {
	await openSeededDay(page);
	await askToDelete(page);
}

test.describe('deleting a time entry', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	/** A dialog, not Productive's immediate delete with an UNDO toast. */
	test('asks which entry before deleting it', async ({ page }) => {
		await openConfirmFromMenu(page);

		const dialog = page.getByRole('dialog', { name: 'Delete this entry?' });

		await expect(dialog).toContainText(NOTED_ENTRY_DURATION);
		await expect(dialog).toContainText(NOTED_ENTRY_NOTE);
	});

	test('deletes nothing when the question is declined', async ({ page }) => {
		await openConfirmFromMenu(page);

		await page.getByRole('button', { name: 'Cancel' }).click();

		await expect(page.getByRole('dialog', { name: 'Delete this entry?' })).toHaveCount(0);
		await expect(page.getByRole('article')).toHaveCount(3);
		await expect(notedEntry(page)).toContainText(NOTED_ENTRY_DURATION);
	});

	/**
	 * The requirement in one test, and the design's "delete stays on day behind the dialog": the
	 * entry goes, the confirmation is raised here rather than on a screen the user was sent to.
	 */
	test('removes the entry from the list without leaving the day', async ({ page }) => {
		await openConfirmFromMenu(page);

		await page.getByRole('button', { name: 'Delete' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('status')).toHaveText('Entry deleted');
		await expect(page.getByRole('article')).toHaveCount(2);
		await expect(page.getByText(NOTED_ENTRY_NOTE)).toHaveCount(0);
	});

	/**
	 * Deleting invalidates the week as well as the day. The strip cell sits directly above the
	 * summary the list drives, so a delete that moved one and not the other would print two
	 * different day totals a centimetre apart.
	 */
	test('takes the minutes off the day summary and the week strip', async ({ page }) => {
		// Read before the dialog opens: Radix marks the day behind it `aria-hidden`, so neither the
		// summary nor the strip is role-queryable while the question is up.
		await openSeededDay(page);
		const summary = page.getByRole('heading', { name: 'Time entries' }).locator('..').locator('..');
		await expect(summary).toContainText('5h logged');
		await expect(summary).toContainText('3 entries');
		await expect(page.getByRole('link', { name: 'Tue 15 Sep, 5h logged' })).toBeVisible();

		await askToDelete(page);
		await page.getByRole('button', { name: 'Delete' }).click();

		// The two that remain are the recorded day's zero-minute entries, so the day empties out
		// without emptying the list - a zero-minute entry is still a real row.
		await expect(summary).toContainText('0h logged');
		await expect(summary).toContainText('2 entries');
		await expect(page.getByRole('link', { name: 'Tue 15 Sep, nothing logged' })).toBeVisible();
	});

	/**
	 * The optimistic removal has to survive the refetch that follows it. Navigated with the date
	 * navigator rather than `goto`, which would reload and clear what the worker remembers.
	 */
	test('still shows it gone after the day is fetched again', async ({ page }) => {
		await openConfirmFromMenu(page);
		await page.getByRole('button', { name: 'Delete' }).click();
		await expect(page.getByRole('article')).toHaveCount(2);

		await page.getByRole('button', { name: 'Previous day' }).click();
		await expect(page).toHaveURL(/\/day\/2026-09-14$/);
		await page.getByRole('button', { name: 'Next day' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('article')).toHaveCount(2);
	});

	/** The form's own way out (design brief 3.4), which lands back on the entry's day. */
	test('deletes from the edit form and returns to the day', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		await page.getByRole('button', { name: 'Entry actions' }).first().click();
		await page.getByRole('menuitem', { name: 'Edit' }).click();
		await expect(page.getByRole('dialog', { name: 'Edit entry' })).toBeVisible();

		await page.getByRole('button', { name: 'Delete entry' }).click();
		await page.getByRole('button', { name: 'Delete' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('status')).toHaveText('Entry deleted');
		await expect(page.getByRole('article')).toHaveCount(2);
	});
});

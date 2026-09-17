import { expect, type Locator, type Page, test } from '@playwright/test';

/**
 * The timer: starting one, seeing it run, and turning it into a saved entry.
 *
 * What only a browser can answer is the shape of the whole thing - that starting one puts a `0h`
 * row on today straight away, that stopping edits *that* entry rather than creating a second, and
 * that the indicator survives a reload. The 409 path, the elapsed clock and the `document.title`
 * mirror are component tests.
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

/** What a seeded entry on today is worth, so a continuation has something to count up from. */
const SEEDED_DURATION = '45m';

/** Whatever day the suite runs on, which is where a timer's entry lands. */
async function gotoToday(page: Page) {
	await page.goto('/');
	await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);
}

test.describe('timer', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	/** Starting one also creates its entry, dated today with `time: 0`. */
	test('starts a timer and puts its entry on today straight away', async ({ page }) => {
		await gotoToday(page);

		await page.getByRole('button', { name: 'Start timer' }).click();

		await expect(page.getByRole('banner').getByRole('button', { name: 'Stop timer' })).toBeVisible();
		await expect(page.getByRole('article').filter({ hasText: '0h' })).toBeVisible();
	});

	/**
	 * The persisted `{ timerId, startedAt, entryId }`, doing the job it exists for: the pill is
	 * already running when the page comes back, rather than reading `Start timer` until the
	 * `['timer', personId]` query answers.
	 */
	test('is still running after a reload', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('banner').getByRole('button', { name: 'Stop timer' })).toBeVisible();

		await page.reload();

		await expect(page.getByRole('banner').getByRole('button', { name: 'Stop timer' })).toBeVisible();
	});

	/**
	 * Stopping edits the entry the start created rather than creating a second one, which is the
	 * behaviour the timer must not get wrong: the day keeps exactly one row.
	 */
	test('stops a timer and saves the tracked time onto its own entry', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('article')).toHaveCount(1);

		await page.getByRole('banner').getByRole('button', { name: 'Stop timer' }).click();

		const sheet = page.getByRole('dialog', { name: 'Save tracked time' });
		await expect(sheet).toBeVisible();

		// A timer stopped inside a minute really does leave `0h` behind - whole minutes are all the
		// API keeps - which is exactly why this field is editable.
		const duration = page.getByRole('textbox', { name: 'Duration' });
		await expect(duration).toBeEnabled();
		await duration.fill('45m');
		await sheet.getByRole('button', { name: 'Save entry' }).click();

		await expect(sheet).toBeHidden();
		await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
		await expect(page.getByRole('article')).toHaveCount(1);
		await expect(page.getByRole('article').first()).toContainText('45m');
	});

	/** Discarding deletes the entry the timer created, because that entry is the tracked time. */
	test('discards the tracked time and leaves nothing behind', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('article')).toHaveCount(1);

		await page.getByRole('banner').getByRole('button', { name: 'Stop timer' }).click();
		const sheet = page.getByRole('dialog', { name: 'Save tracked time' });
		await expect(sheet.getByRole('textbox', { name: 'Duration' })).toBeEnabled();
		await sheet.getByRole('button', { name: 'Discard' }).click();

		await expect(sheet).toBeHidden();
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
	});

	/**
	 * `Card Actions.dc.html` puts continuing on the row as a play button where there is a pointer to
	 * reveal it, and leaves it in the kebab on touch - no hover, and no room beside a 15px note.
	 */
	async function continueTimerOn(entry: Locator, page: Page, project: string) {
		if (project === 'mobile-chrome') {
			await entry.getByRole('button', { name: 'Entry actions' }).click();
			await page.getByRole('menuitem', { name: 'Continue timer' }).click();

			return;
		}
		await entry.getByRole('button', { name: 'Continue timer on this entry' }).click();
	}

	/**
	 * Continuing is a today-only action, so the entry to continue has to be made here: a timer run,
	 * stopped and saved, which is the shortest way to a row on today holding real minutes.
	 */
	async function seedEntryOnToday(page: Page) {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('article')).toHaveCount(1);

		await page.getByRole('banner').getByRole('button', { name: 'Stop timer' }).click();
		const sheet = page.getByRole('dialog', { name: 'Save tracked time' });
		await expect(sheet.getByRole('textbox', { name: 'Duration' })).toBeEnabled();
		await sheet.getByRole('textbox', { name: 'Duration' }).fill(SEEDED_DURATION);
		await sheet.getByRole('button', { name: 'Save entry' }).click();
		await expect(sheet).toBeHidden();
		await expect(page.getByRole('article').first()).toContainText(SEEDED_DURATION);
	}

	/**
	 * A continuation, not a copy: `POST /timers` with a `time_entry` relationship attaches to the
	 * entry instead of creating one. So the row that was clicked is the row that counts up, on its
	 * own day, and the day is no longer than it was.
	 *
	 * Runs on both projects: the play button is a pointer affordance, and touch reaches the same
	 * action through the kebab.
	 */
	test('continues the entry it was started from, on its own day', { tag: '@mobile' }, async ({ page }, testInfo) => {
		await seedEntryOnToday(page);

		const entry = page.getByRole('article').first();
		await continueTimerOn(entry, page, testInfo.project.name);

		// Still one row, and it is the one running.
		await expect(page.getByRole('article')).toHaveCount(1);
		await expect(entry.getByText('Tracking')).toBeVisible();
		// Counting up from what it already holds, not from zero.
		await expect(entry).toContainText(SEEDED_DURATION);
	});
});

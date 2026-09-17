import { expect, type Page, test } from '@playwright/test';

/**
 * X-4 on both projects: starting a timer, seeing it run, and turning it into a described entry.
 *
 * What only a browser can answer is the shape of the whole thing - that starting one puts a `0h`
 * row on today straight away (SPEC 11, finding 1), that stopping edits *that* entry rather than
 * creating a second, and that the indicator survives a reload. The 409 path, the elapsed clock and
 * the `document.title` mirror are component tests.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';
const TIMER_STORAGE_KEY = 'tracktive.timer';

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

/** The recorded day, for continuing an entry that already has time on it. */
const SEEDED_DATE = '2026-09-15';
const FIRST_ENTRY_NOTE = 'Probavam';

/** Whatever day the suite runs on, which is where a timer's entry lands. */
async function gotoToday(page: Page) {
	await page.goto('/');
	await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);
}

test.describe('timer (X-4)', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('opens with no timer running', async ({ page }) => {
		await gotoToday(page);

		await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
	});

	/** Starting one also creates its entry, dated today with `time: 0` - SPEC 11, finding 1. */
	test('starts a timer and puts its entry on today straight away', async ({ page }) => {
		await gotoToday(page);

		await page.getByRole('button', { name: 'Start timer' }).click();

		await expect(page.getByRole('button', { name: /^Stop timer/ })).toBeVisible();
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
		await expect(page.getByRole('button', { name: /^Stop timer/ })).toBeVisible();

		await page.reload();

		await expect(page.getByRole('button', { name: /^Stop timer/ })).toBeVisible();
	});

	/**
	 * Stopping edits the entry the start created rather than creating a second one, which is the
	 * behaviour SPEC 11 says X-4 must not get wrong: the day keeps exactly one row.
	 */
	test('stops a timer and saves the tracked time onto its own entry', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('article')).toHaveCount(1);

		await page.getByRole('button', { name: /^Stop timer/ }).click();

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

		await page.getByRole('button', { name: /^Stop timer/ }).click();
		const sheet = page.getByRole('dialog', { name: 'Save tracked time' });
		await expect(sheet.getByRole('textbox', { name: 'Duration' })).toBeEnabled();
		await sheet.getByRole('button', { name: 'Discard' }).click();

		await expect(sheet).toBeHidden();
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
	});

	/**
	 * X-4 after review: the app bar was the only sign a timer was running, and on a full day the
	 * row it belongs to can be scrolled far from it (`Timer.dc.html`). The row says so itself, and
	 * carries a stop of its own - both drive the one timer.
	 */
	test('marks the row it is running against, and stops from there', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();

		const tracking = page.getByRole('article').first();
		await expect(tracking.getByText('Tracking')).toBeVisible();

		await tracking.getByRole('button', { name: 'Stop timer' }).click();

		await expect(page.getByRole('dialog', { name: 'Save tracked time' })).toBeVisible();
	});

	/**
	 * A timer's entry is always dated today (SPEC 11), so continuing an entry from another day logs
	 * the new time there. Staying put left the screen looking as though nothing had happened.
	 */
	test('continues an entry onto today, carrying its description', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('article').first().getByRole('button', { name: 'Entry actions' }).click();
		await page.getByRole('menuitem', { name: 'Continue timer' }).click();

		await expect(page).toHaveURL(/\/day\/\d{4}-\d{2}-\d{2}$/);
		await expect(page).not.toHaveURL(`/day/${SEEDED_DATE}`);

		const tracking = page.getByRole('article').first();
		await expect(tracking.getByText('Tracking')).toBeVisible();
		await expect(tracking).toContainText(FIRST_ENTRY_NOTE);
	});

	/** One timer at a time: starting a second silently would be the worst of the three behaviours. */
	test('will not continue a second entry while one is running', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('article').first().getByText('Tracking')).toBeVisible();

		await page.goto(`/day/${SEEDED_DATE}`);
		await page.getByRole('article').first().getByRole('button', { name: 'Entry actions' }).click();

		await expect(page.getByRole('menuitem', { name: 'Continue timer' })).toHaveAttribute('aria-disabled', 'true');
	});

	/** X-2 lists `s`; this is the timer it stops, and it works from any route. */
	test('stops the timer with the s key', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('button', { name: /^Stop timer/ })).toBeVisible();

		await page.keyboard.press('s');

		await expect(page.getByRole('dialog', { name: 'Save tracked time' })).toBeVisible();
	});

	/** Logging out forgets the timer, or the next person here opens with someone else's running. */
	test('forgets the timer on logout', async ({ page }) => {
		await gotoToday(page);
		await page.getByRole('button', { name: 'Start timer' }).click();
		await expect(page.getByRole('button', { name: /^Stop timer/ })).toBeVisible();

		await page.getByRole('button', { name: 'Account menu' }).click();
		await page.getByRole('menuitem', { name: 'Log out' }).click();

		await expect(page).toHaveURL('/login');
		const { origins } = await page.context().storageState();
		const stored = origins.flatMap((origin) => origin.localStorage).find((item) => item.name === TIMER_STORAGE_KEY);
		expect(stored).toBeUndefined();
	});
});

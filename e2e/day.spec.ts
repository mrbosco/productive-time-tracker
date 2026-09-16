import { expect, type Page, test } from '@playwright/test';

/**
 * US-1 on both projects (desktop and Pixel 5): the day the URL names, the entries on it, the four
 * ways there are none, and moving between days.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock` (ADR-0003). That worker serves the
 * recorded day for `SEEDED_DATE` and an empty day for every other date, and takes no per-test
 * override - so the error state (R-8) is covered by the component test, which can install a
 * failing handler.
 *
 * `page.route` is not a way around that, and it was measured rather than assumed: the worker
 * fulfils the request inside the page, so Playwright's network layer never sees it and the route
 * handler is called zero times.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day.json` was recorded for. */
const SEEDED_DATE = '2026-09-15';

/**
 * A date that can never be the day the suite runs on, for the assertions that depend on a day
 * other than today being selected.
 */
const LONG_PAST_DATE = '2020-01-15';

// No leading anchor: `toHaveURL` matches a regex against the whole URL, origin included.
const DAY_URL = /\/day\/\d{4}-\d{2}-\d{2}$/;

/**
 * Entries are counted as `article`, not as `listitem`. A note written as a bullet list renders real
 * `<li>` elements of its own now (ADR-0010), so `listitem` no longer means "one entry" - the card
 * itself is the article.
 */

/**
 * Seeds the session so each test starts on the day view rather than logging in again - US-0 has
 * its own spec. Passed as source because the e2e project compiles without the DOM lib.
 */
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

/**
 * The empty state's own `Add entry`, not the always-present one. Both are links to the same place
 * with the same name, which is the design (`02-day-mobile-empty.png`); the empty card is rendered
 * after the FAB, so it is the last of the two.
 */
function emptyStateAddEntry(page: Page) {
	return page.getByRole('link', { name: 'Add entry' }).last();
}

test.describe('the day view', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('lists the entries logged on the day in the URL (R-3)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByRole('article')).toHaveCount(3);
		await expect(page.getByText('Probavam')).toBeVisible();
		await expect(page.getByText('Acquiring new clients').first()).toBeVisible();
	});

	test('shows each entry as a duration (R-6)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// Scoped to the list: the week strip above it renders durations of its own.
		const list = page.getByRole('list');

		await expect(list.getByText('5h', { exact: true })).toBeVisible();
		await expect(list.getByText('4h', { exact: true })).toBeVisible();
		// A-8: a zero-minute entry is a real record and is rendered, not skipped.
		await expect(list.getByText('0h', { exact: true })).toBeVisible();
	});

	/** A-7: the API cannot sort on `created_at`, and the fixture stores the day newest-first. */
	test('orders the entries by when they were logged', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		const durations = page.getByRole('article');

		await expect(durations.nth(0)).toContainText('5h');
		await expect(durations.nth(1)).toContainText('0h');
		await expect(durations.nth(2)).toContainText('4h');
	});

	/** X-1: the week around the selected day, from one request, grouped client-side. */
	test('shows the week around the selected day', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// Mon 14 to Sun 20, plus the week's own total cell.
		await expect(page.getByRole('link', { name: /^Mon 14 Sep/ })).toBeVisible();
		await expect(page.getByRole('link', { name: /^Sun 20 Sep/ })).toBeVisible();
		await expect(page.getByText('Week', { exact: true })).toBeVisible();
	});

	test('marks the selected day in the week strip', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByRole('link', { name: /^Tue 15 Sep/ })).toHaveAttribute('aria-current', 'page');
	});

	test('carries the day total into the week strip', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByRole('link', { name: 'Tue 15 Sep, 9h logged' })).toBeVisible();
	});

	test('moves to another day from the week strip (R-5)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('link', { name: /^Thu 17 Sep/ }).click();

		await expect(page).toHaveURL('/day/2026-09-17');
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
	});

	/**
	 * X-1, design brief 3.2: "with the selected cell centered". Seven cells and the week's own do
	 * not fit a 390px screen and the row starts at Monday, so on Pixel 5 a Sunday is off the right
	 * edge unless something scrolls it back. Asserted as geometry rather than as a scroll offset,
	 * because "you can see the day you picked" is the behaviour and the offset is one way to get
	 * there. On desktop the grid never overflows and this holds without anything scrolling.
	 */
	test('keeps the selected day on screen at the end of the week (X-1)', async ({ page }) => {
		await page.goto('/day/2026-09-20');

		// `ratio: 1` is the whole point: the default passes on a single visible pixel, which is
		// exactly the state this is meant to catch.
		await expect(page.getByRole('link', { name: /^Sun 20 Sep/ })).toBeInViewport({ ratio: 1 });
	});

	test('totals the day', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// `logged ·` rather than `logged`, which is also a word in the empty state's sentence.
		await expect(page.getByText(/logged ·/)).toContainText('9h');
		await expect(page.getByText(/logged ·/)).toContainText('3 entries');
	});

	/**
	 * A-9 as amended by ADR-0010: the recorded note is rich text and arrives with its structure.
	 * It used to be flattened to a line, which was the app redrawing what the user wrote.
	 */
	test('renders a rich-text note with the structure it was written in', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByText('Probavam')).toBeVisible();
		await expect(page.getByRole('article').first().locator('ul li')).toHaveCount(1);
		// Still no markup leaking through as text.
		await expect(page.getByText('<ul>')).toHaveCount(0);
	});

	test('names the day in words', async ({ page }) => {
		await page.goto(`/day/${LONG_PAST_DATE}`);

		await expect(page.getByRole('heading', { level: 1, name: 'Wed 15 Jan 2020' })).toBeVisible();
	});

	test('steps to the previous day and reloads the list (R-5)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article')).toHaveCount(3);

		await page.getByRole('button', { name: 'Previous day' }).click();

		await expect(page).toHaveURL('/day/2026-09-14');
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
	});

	test('steps back to the day it came from', async ({ page }) => {
		await page.goto('/day/2026-09-14');

		await page.getByRole('button', { name: 'Next day' }).click();

		await expect(page).toHaveURL(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article')).toHaveCount(3);
	});

	test('jumps back to today, and then hides the way to do it', async ({ page }) => {
		await page.goto(`/day/${LONG_PAST_DATE}`);

		// `exact`, because the accessible name is matched as a substring by default and the day
		// heading reads "Today, Tue 15 Sep" once the jump has happened.
		const todayButton = page.getByRole('button', { name: 'Today', exact: true });

		await todayButton.click();

		await expect(page).toHaveURL(DAY_URL);
		await expect(page.getByRole('heading', { level: 1, name: /^Today, / })).toBeVisible();
		await expect(todayButton).toHaveCount(0);
	});

	test('picks a day from the calendar the label opens (A-3)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('heading', { level: 1 }).getByRole('button').click();
		await page.getByRole('button', { name: 'Thursday, September 10th, 2026' }).click();

		await expect(page).toHaveURL('/day/2026-09-10');
	});

	test('does not summarise a day that has nothing on it', async ({ page }) => {
		await page.goto('/day/2026-09-02');
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();

		// `0h logged · 0 entries` would only restate the sentence in the empty state.
		await expect(page.getByText(/logged ·/)).toHaveCount(0);
	});

	/** R-7: one sentence and the primary action. */
	test('offers a way to log time on a day with nothing on it', async ({ page }) => {
		await page.goto('/day/2026-09-02');

		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Add entry' })).toHaveCount(2);

		await emptyStateAddEntry(page).click();

		await expect(page).toHaveURL('/entries/new?date=2026-09-02');
	});

	/** Drawn on this screen but owned by later stories; the page is read-only until they land. */
	test('carries the controls the write flows will use', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Quick add an entry' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Entry actions' }).first()).toBeVisible();
	});

	test('opens the entry menu on a card', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('button', { name: 'Entry actions' }).first().click();

		await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
		await expect(page.getByRole('menuitem', { name: 'Delete' })).toBeVisible();
	});

	test('offers Add entry on a day that already has entries', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('link', { name: 'Add entry' }).click();

		await expect(page).toHaveURL(`/entries/new?date=${SEEDED_DATE}`);
	});

	test('sends the bare root to today (R-3)', async ({ page }) => {
		await page.goto('/');

		await expect(page).toHaveURL(DAY_URL);
		await expect(page.getByRole('heading', { level: 1, name: /^Today, / })).toBeVisible();
	});

	test('sends a date that is not one to today rather than to an error', async ({ page }) => {
		await page.goto('/day/not-a-date');

		await expect(page).toHaveURL(DAY_URL);
		await expect(page.getByRole('heading', { level: 1, name: /^Today, / })).toBeVisible();
	});

	test('keeps the day in the URL across a refresh', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.reload();

		await expect(page).toHaveURL(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article')).toHaveCount(3);
	});

	test('moves focus to the day heading when the day changes (guidebook 18)', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('button', { name: 'Previous day' }).click();

		await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
	});
});

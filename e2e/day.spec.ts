import { expect, type Page, test } from '@playwright/test';

/**
 * Reading a day, on both projects (desktop and Pixel 5): the day the URL names, the entries on it,
 * the empty day, and moving between days.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock` (ADR-0003). That worker serves the
 * recorded day for `SEEDED_DATE` and an empty day for every other date, and takes no per-test
 * override - so the error state is covered by the component test, which can install a
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
 * Seeds the session so each test starts on the day view rather than logging in again - the login
 * spec covers signing in. Passed as source because the e2e project compiles without the DOM lib.
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

test.describe('the day view', { tag: '@mobile' }, () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('lists the entries logged on the day in the URL', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByRole('article')).toHaveCount(3);
		await expect(page.getByText('Probavam')).toBeVisible();
		await expect(page.getByText('Acquiring new clients').first()).toBeVisible();
	});

	test('shows each entry as a duration', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// Scoped to the list: the week strip above it renders durations of its own.
		const list = page.getByRole('list');

		await expect(list.getByText('5h', { exact: true })).toBeVisible();
		// A zero-minute entry is a real record and is rendered, not skipped. The recorded day holds
		// two of them, which is why this counts rather than asserting one is visible.
		await expect(list.getByText('0h', { exact: true })).toHaveCount(2);
	});

	/**
	 * Newest first. The API cannot sort on `created_at` at all, so this is entirely the client-side
	 * sort - and the fixture's own order is neither ascending nor descending, which is what makes
	 * the assertion mean something.
	 *
	 * Asserted on the service rather than the duration: the recorded day's two newest entries are
	 * both zero-minute, so durations no longer tell the rows apart.
	 */
	test('puts the most recently logged entry at the top', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		const entries = page.getByRole('article');

		await expect(entries.nth(0)).toContainText('Project management');
		await expect(entries.nth(1)).toContainText('0h');
		await expect(entries.nth(2)).toContainText('5h');
	});

	/** The week around the selected day, from one request, grouped client-side. */
	test('shows the week around the selected day', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// Mon 14 to Sun 20, plus the week's own total cell.
		await expect(page.getByRole('link', { name: /^Mon 14 Sep/ })).toBeVisible();
		await expect(page.getByRole('link', { name: /^Sun 20 Sep/ })).toBeVisible();
		await expect(page.getByText('Weekly total', { exact: true })).toBeVisible();
	});

	test('moves to another day from the week strip', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('link', { name: /^Thu 17 Sep/ }).click();

		await expect(page).toHaveURL('/day/2026-09-17');
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
	});

	test('totals the day', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		// The summary is a heading with a count beside it and the logged time at the other end of
		// the same row. Anchored on the heading, because the right-hand service panel prints the
		// day's count too and an unscoped query would match both.
		const summary = page.getByRole('heading', { name: 'Time entries' }).locator('..').locator('..');

		await expect(summary).toContainText('5h logged');
		await expect(summary).toContainText('3 entries');
	});

	/**
	 * ADR-0010: the recorded note is rich text and arrives with its structure. It used to be
	 * flattened to a line, which was the app redrawing what the user wrote.
	 */
	test('renders a rich-text note with the structure it was written in', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await expect(page.getByText('Probavam')).toBeVisible();
		await expect(page.getByRole('article').filter({ hasText: 'Probavam' }).locator('ul li')).toHaveCount(1);
		// Still no markup leaking through as text.
		await expect(page.getByText('<ul>')).toHaveCount(0);
	});

	test('steps to the previous day and reloads the list', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article')).toHaveCount(3);

		await page.getByRole('button', { name: 'Previous day' }).click();

		await expect(page).toHaveURL('/day/2026-09-14');
		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
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

	test('picks a day from the calendar the label opens', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		await page.getByRole('heading', { level: 1 }).getByRole('button').click();
		await page.getByRole('button', { name: 'Thursday, September 10th, 2026' }).click();

		await expect(page).toHaveURL('/day/2026-09-10');
	});

	/** The empty day: one sentence and the primary action. */
	test('offers a way to log time on a day with nothing on it', async ({ page }) => {
		await page.goto('/day/2026-09-02');

		await expect(page.getByText('Nothing logged for this day yet.')).toBeVisible();
		await expect(page.getByRole('link', { name: 'Add entry' })).toHaveCount(2);

		await emptyStateAddEntry(page).click();

		await expect(page).toHaveURL('/entries/new?date=2026-09-02');
	});

	test('sends the bare root to today', async ({ page }) => {
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
});

import { expect, type Page, test } from '@playwright/test';

/**
 * US-2 on both projects: the form opens on the right day, rejects what A-8 rejects, and a saved
 * entry is in the list behind it (R-9).
 *
 * Both layouts are covered by running the same spec twice - the form is a full screen on Pixel 5
 * and a dialog over the day on desktop, and every assertion here is on roles and names, so neither
 * is assumed.
 *
 * Runs against the MSW worker booted by `pnpm dev:mock` (ADR-0003). The worker remembers entries
 * created during a page session, which is what makes "the list updates after success" assertable
 * here rather than only in a component test. A reload clears that memory, so these tests navigate
 * rather than reload.
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

/** From the day view, the way the design offers: the FAB on mobile, the header button on desktop. */
async function openForm(page: Page) {
	await page.goto(`/day/${SEEDED_DATE}`);
	await page.getByRole('link', { name: 'Add entry' }).click();
	await expect(page).toHaveURL(new RegExp(`/entries/new\\?date=${SEEDED_DATE}$`));
}

test.describe('adding a time entry', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('opens the form on the day being viewed (A-5)', async ({ page }) => {
		await openForm(page);

		await expect(page.getByRole('dialog', { name: 'New entry' })).toBeVisible();
		await expect(page.getByRole('button', { name: /Date Tue 15 Sep 2026/ })).toBeVisible();
	});

	/**
	 * The root route moves focus to the page heading after every navigation (guidebook 18), and on
	 * this route the day renders behind the dialog - so its `h1` is in the document but inside the
	 * subtree Radix has marked `aria-hidden`. Focus has to end up inside the dialog, not in the
	 * hidden screen behind it.
	 */
	test('keeps focus inside the dialog rather than the day behind it (guidebook 18)', async ({ page }) => {
		await openForm(page);
		await expect(page.getByRole('dialog', { name: 'New entry' })).toBeVisible();

		// Passed as source, not a closure: the e2e project compiles without the DOM lib, so
		// `document` is not a name this file can reference - the same reason `signIn` does it.
		const focusIsInsideDialog: unknown = await page.evaluate(
			`document.activeElement?.closest('[role="dialog"]') !== null`
		);

		expect(focusIsInsideDialog).toBe(true);
	});

	test('logs the entry and shows it on the day (US-2, R-9)', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('1h 30m');
		await page.getByRole('textbox', { name: 'Description' }).fill('Mapped the time_entries payload');
		await page.getByRole('button', { name: 'Save entry' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('status')).toHaveText('Entry saved');
		await expect(page.getByText('Mapped the time_entries payload')).toBeVisible();
		await expect(page.getByRole('article')).toHaveCount(4);
	});

	/** A-2: the preview is the only confirmation that what was typed was read as intended. */
	test('previews what the typed duration will be saved as', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('1.5h');

		await expect(page.getByText('= 1h 30m')).toBeVisible();
	});

	test('says nothing is wrong until Save is pressed, then says exactly what is (A-8)', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('half a day');
		await expect(page.getByText('Accepts 1h 30m, 1:30, 1.5h or 90')).toBeVisible();

		await page.getByRole('button', { name: 'Save entry' }).click();

		await expect(page.getByText('Enter a duration like 1h 30m, 1:30, 1.5h or 90.')).toBeVisible();
		await expect(page).toHaveURL(new RegExp('/entries/new'));
	});

	/**
	 * History state outlives the page - the browser restores it on reload - so the day view spends
	 * the message when the toast goes. Otherwise refreshing would announce a save that happened
	 * minutes ago.
	 */
	test('does not announce the save again after a refresh', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('30m');
		await page.getByRole('button', { name: 'Save entry' }).click();
		await expect(page.getByRole('status')).toHaveText('Entry saved');

		// Let it dismiss itself first: that is the moment the message is spent.
		await expect(page.getByRole('status')).toHaveCount(0);

		await page.reload();

		await expect(page.getByRole('status')).toHaveCount(0);
	});

	/**
	 * Improvements 10, through the one route a component test cannot take: the backdrop. On mobile
	 * the form fills the screen, so there is no backdrop to hit - the same question is asked by the
	 * back arrow, which the component tests cover.
	 */
	test('asks before the backdrop throws away what was typed', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'the mobile form is full screen: no backdrop');
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('1h 45m');
		await page.mouse.click(20, 20);

		await expect(page.getByRole('dialog', { name: 'Save your changes?' })).toBeVisible();
		await expect(page).toHaveURL(new RegExp('/entries/new'));
	});

	test('adds nothing when the draft is discarded', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('2h');
		await page.getByRole('button', { name: 'Cancel' }).click();
		// Typed something, so Cancel asks rather than leaving (Improvements 10).
		await page.getByRole('button', { name: 'Discard changes' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		await expect(page.getByRole('article')).toHaveCount(3);
		await expect(page.getByRole('status')).toHaveCount(0);
	});

	/**
	 * ADR-0010, and the reason these live here rather than in a component test: ProseMirror listens
	 * for `beforeinput` and composition events jsdom does not implement, so the editor only really
	 * runs in a browser.
	 */
	/**
	 * The placeholder is one absolutely positioned line behind the document, so if it outstays the
	 * first keystroke it sits *under* what is being typed. Only a browser can catch it: TipTap 3's
	 * `useEditor` no longer re-renders on every transaction, so whether the editor's emptiness is
	 * subscribed to or merely read once is invisible to a test that cannot type.
	 */
	test('drops the placeholder as soon as there is something written', async ({ page }) => {
		await openForm(page);

		const description = page.getByRole('textbox', { name: 'Description' });
		const placeholder = page.getByText('What did you work on?');
		await expect(placeholder).toBeVisible();

		await description.click();
		await page.keyboard.type('Paired on the duration parser');

		await expect(placeholder).toBeHidden();

		// And back, which is the half that no amount of re-rendering elsewhere would have covered:
		// emptying the field changes nothing the form is subscribed to.
		await page.keyboard.press('ControlOrMeta+a');
		await page.keyboard.press('Backspace');

		await expect(placeholder).toBeVisible();
	});

	test('starts a list from a dash, and saves it as one', async ({ page }) => {
		await openForm(page);

		await page.getByRole('textbox', { name: 'Duration' }).fill('30m');
		const description = page.getByRole('textbox', { name: 'Description' });
		await description.click();
		await page.keyboard.type('- first');
		await page.keyboard.press('Enter');
		await page.keyboard.type('second');

		await expect(description.locator('ul li')).toHaveCount(2);

		await page.getByRole('button', { name: 'Save entry' }).click();

		// And the day renders it as a list too, rather than flattening it back to lines.
		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
		// First, not last: A-7 puts the newest entry at the top.
		await expect(page.getByRole('article').first().locator('ul li')).toHaveCount(2);
	});

	test('bolds the selection with the usual shortcut', async ({ page }) => {
		await openForm(page);

		const description = page.getByRole('textbox', { name: 'Description' });
		await description.click();
		await page.keyboard.type('plain ');
		await page.keyboard.press('ControlOrMeta+b');
		await page.keyboard.type('bold');

		await expect(description.locator('strong')).toHaveText('bold');
	});

	/**
	 * The editor only runs in a browser, so this is the only level that can assert a typed note
	 * survives anything. Covers the failed-save case the component test cannot reach.
	 */
	test('keeps the written note when the form is reopened after a prompt', async ({ page }) => {
		await openForm(page);

		const description = page.getByRole('textbox', { name: 'Description' });
		await description.click();
		await page.keyboard.type('- worth keeping');

		await page.getByRole('button', { name: 'Cancel' }).click();
		await page.getByRole('button', { name: 'Continue editing' }).click();

		await expect(description.locator('ul li')).toHaveCount(1);
		await expect(description).toContainText('worth keeping');
	});

	/**
	 * Tab is "next control" in a form, not "indent the list" (guidebook 18).
	 *
	 * Two items, not one: indenting the *first* item of a list is a no-op in ProseMirror, so a
	 * single-item version passes whether or not the binding was removed. The caret has to sit on
	 * a second item for Tab to have something to do.
	 */
	test('lets Tab leave the editor rather than indenting the list', async ({ page }) => {
		await openForm(page);

		const description = page.getByRole('textbox', { name: 'Description' });
		await description.click();
		await page.keyboard.type('- first');
		await page.keyboard.press('Enter');
		await page.keyboard.type('second');
		await expect(description.locator('ul li')).toHaveCount(2);

		await page.keyboard.press('Tab');

		await expect(description.locator('ul ul')).toHaveCount(0);
		await expect(description).not.toBeFocused();
	});

	test('closes an untouched form without asking', async ({ page }) => {
		await openForm(page);

		await page.getByRole('button', { name: 'Cancel' }).click();

		await expect(page).toHaveURL(new RegExp(`/day/${SEEDED_DATE}$`));
	});

	/** The service is not a field (A-1), so the form says which one it will use and where to change it. */
	test('names the service the entry will be logged against, and opens where to change it', async ({ page }) => {
		await openForm(page);

		await page.getByRole('button', { name: /Acquiring new clients/ }).click();

		await expect(page.getByRole('dialog', { name: 'Default service' })).toBeVisible();
		await expect(page.getByText('Used for new entries and the timer.')).toBeVisible();
	});
});

import { expect, type Page, test } from '@playwright/test';

/**
 * Keyboard shortcuts: the keys the shortcuts sheet teaches, and the sheet itself.
 *
 * A happy path per shortcut rather than a matrix. What the keys do once they fire - which card is
 * chosen, which day is next - is a component test with a router it can assert on; what only a real
 * browser can answer is whether a keystroke on the page reaches the window listener at all.
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

test.describe('keyboard shortcuts', () => {
	test.beforeEach(async ({ page }) => {
		await signIn(page);
	});

	test('opens the shortcuts sheet with ? and closes it with Escape', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		// The listener goes on at mount, so pressing a key at a page that has not rendered yet is a
		// key pressed at nothing. Every other test here waits for the list; this one has no list to
		// wait for, so it waits for the bar.
		await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();

		await page.keyboard.press('?');

		const sheet = page.getByRole('dialog', { name: 'Keyboard shortcuts' });
		await expect(sheet).toBeVisible();
		await expect(sheet.getByText('New entry')).toBeVisible();

		await page.keyboard.press('Escape');

		await expect(sheet).toBeHidden();
	});

	test('opens the entry form with n', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article').first()).toBeVisible();

		await page.keyboard.press('n');

		await expect(page).toHaveURL(`/entries/new?date=${SEEDED_DATE}`);
		await expect(page.getByRole('dialog', { name: 'New entry' })).toBeVisible();
	});

	test('moves between entries and edits the one it lands on', async ({ page }) => {
		await page.goto(`/day/${SEEDED_DATE}`);
		await expect(page.getByRole('article').first()).toBeVisible();

		// Tab is how you enter the list; the arrows move within it. Clicking a card is the same
		// entry point and is one action rather than six tab stops.
		//
		// In the corner rather than the middle: a card's centre is over the project name at 390px,
		// and that is a button of its own now. Clicking it would open the service context
		// instead of choosing the card, which is what a real finger aiming at a card would avoid.
		await page
			.getByRole('article')
			.first()
			.click({ position: { x: 6, y: 6 } });
		await expect(page.getByRole('article').first()).toBeFocused();

		await page.keyboard.press('ArrowDown');
		await expect(page.getByRole('article').nth(1)).toBeFocused();

		await page.keyboard.press('e');

		await expect(page).toHaveURL(/\/entries\/\d+\/edit$/);
		await expect(page.getByRole('dialog', { name: 'Edit entry' })).toBeVisible();
	});
});

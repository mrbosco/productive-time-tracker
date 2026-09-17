import { expect, type Page, test } from '@playwright/test';

/**
 * UI-1 and UI-2 on both projects: the company at the leading edge of a card, and the context
 * behind the project name.
 *
 * Here rather than in a component test because the two surfaces this draws are chosen by the
 * pointer, and jsdom has neither. `matchMedia` is missing there, so every component test takes the
 * touch branch; the hover branch is only reachable on a real desktop pointer, which
 * `desktop-chromium` is and `mobile-chrome` is not.
 */
const SESSION_STORAGE_KEY = 'tracktive.session';

/** The date `docs/api/samples/time-entries-day-service-context.json` was recorded for. */
const SEEDED_DATE = '2026-09-15';

/** The recorded day's first card, and the project its service sits under. */
const FIRST_PROJECT = 'Fixed price [SAMPLE]';

async function signIn(page: Page) {
	await page.addInitScript(
		`window.localStorage.setItem(${JSON.stringify(SESSION_STORAGE_KEY)}, ${JSON.stringify(
			JSON.stringify({
				token: 'test-token',
				organizationId: '999999',
				personId: '1448639',
				personName: 'Ada Lovelace',
			})
		)})`
	);
}

test.beforeEach(async ({ page }) => {
	await signIn(page);
});

test('leads every card with its company and ends it with the duration', async ({ page }) => {
	await page.goto(`/day/${SEEDED_DATE}`);

	const card = page.getByRole('article').first();
	await expect(card).toBeVisible();

	// The company avatar is the first thing in the row and the duration is the last before the
	// kebab, which is the swap UI-1 makes.
	const avatar = card.locator('img, span[aria-hidden="true"]').first();
	const avatarBox = await avatar.boundingBox();
	const durationBox = await card
		.getByText(/^\d+h( \d+m)?$|^\d+m$/)
		.first()
		.boundingBox();
	expect(avatarBox).not.toBeNull();
	expect(durationBox).not.toBeNull();
	expect(avatarBox!.x).toBeLessThan(durationBox!.x);
});

test('names the project beside the service', async ({ page }) => {
	await page.goto(`/day/${SEEDED_DATE}`);

	await expect(page.getByRole('article').first()).toContainText(FIRST_PROJECT);
	await expect(page.getByRole('article').first()).toContainText('Project management');
});

test('opens the service context from the project name', async ({ page }, testInfo) => {
	await page.goto(`/day/${SEEDED_DATE}`);

	const trigger = page.getByRole('button', { name: FIRST_PROJECT }).first();
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');

	if (testInfo.project.name === 'mobile-chrome') {
		// No hover on a phone, so the same name opens a sheet instead. The trigger cannot be
		// re-queried by role once it is open: the sheet hides the rest of the page from assistive
		// technology, which is the behaviour we want and which `getByRole` honours.
		await trigger.tap();
		await expect(page.getByRole('dialog')).toContainText('Deal');
	} else {
		await trigger.hover();
		await expect(page.getByRole('tooltip')).toContainText('Deal');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	}
});

test('reaches the context from the keyboard, so it is not hover-only', async ({ page }, testInfo) => {
	await page.goto(`/day/${SEEDED_DATE}`);

	const trigger = page.getByRole('button', { name: FIRST_PROJECT }).first();
	await trigger.focus();

	if (testInfo.project.name === 'mobile-chrome') {
		await page.keyboard.press('Enter');
		await expect(page.getByRole('dialog')).toBeVisible();

		return;
	}

	// Focus alone opens it - that is Radix, and it is the reason a tooltip here is reachable
	// without a pointer at all.
	await expect(page.getByRole('tooltip')).toBeVisible();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');

	await page.keyboard.press('Escape');
	await expect(page.getByRole('tooltip')).toHaveCount(0);
});

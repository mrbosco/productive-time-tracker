import { expect, type Page, test } from '@playwright/test';

/**
 * What an entry card offers a pointer: the service context behind the project name, and the inline
 * duration editor.
 *
 * Here rather than in a component test because the surfaces these draw are chosen by the pointer,
 * and jsdom has neither. `matchMedia` is missing there, so every component test takes the touch
 * branch; the hover branch is only reachable on a real desktop pointer, which `desktop-chromium`
 * is and `mobile-chrome` is not.
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

test(
	'reaches the context from the keyboard, so it is not hover-only',
	{ tag: '@mobile' },
	async ({ page }, testInfo) => {
		await page.goto(`/day/${SEEDED_DATE}`);

		const trigger = page.getByRole('button', { name: FIRST_PROJECT }).first();
		await trigger.focus();

		if (testInfo.project.name === 'mobile-chrome') {
			// No hover on a phone, so the same name opens a sheet instead.
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
	}
);

/**
 * The inline editor and the play button are a pointer's affordances (`Card Actions.dc.html`): a
 * 112px field and a chip row do not fit beside a note at 390, and there is no hover to reveal a
 * pencil. jsdom reports no hover either, so this is the only place the desktop row is exercised.
 */
test('corrects a duration in place, on a pointer', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chrome', 'touch keeps both actions in the kebab');
	await page.goto(`/day/${SEEDED_DATE}`);

	const card = page.getByRole('article').filter({ hasText: 'Probavam' });
	await card.getByRole('button', { name: /Edit logged time/ }).click();

	const field = page.getByRole('textbox', { name: 'Duration' });
	await expect(field).toBeFocused();
	await field.fill('1h 45m');
	await expect(page.getByText('= 1h 45m')).toBeVisible();
	await page.keyboard.press('Enter');

	await expect(card.getByRole('button', { name: 'Edit logged time, 1h 45m' })).toBeVisible();
});

test('refuses what the entry form refuses, and Escape restores', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chrome', 'touch keeps both actions in the kebab');
	await page.goto(`/day/${SEEDED_DATE}`);

	const card = page.getByRole('article').filter({ hasText: 'Probavam' });
	await card.getByRole('button', { name: /Edit logged time/ }).click();
	await page.getByRole('textbox', { name: 'Duration' }).fill('half a day');

	await expect(page.getByText('Enter a duration like 1h 30m, 1:30, 1.5h or 90.')).toBeVisible();

	await page.keyboard.press('Escape');
	await expect(card.getByRole('button', { name: 'Edit logged time, 5h' })).toBeVisible();
});

/**
 * The two keys `Card Actions.dc.html` puts on a focused row, and the Undo it puts on the toast
 * instead of a confirm dialog. Desktop only, for the same reason the field is.
 */
test('opens the field with Enter on the focused row, and Undo puts the number back', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chrome', 'touch keeps both actions in the kebab');
	await page.goto(`/day/${SEEDED_DATE}`);

	const card = page.getByRole('article').filter({ hasText: 'Probavam' });
	await card.focus();
	await page.keyboard.press('Enter');

	const field = page.getByRole('textbox', { name: 'Duration' });
	await expect(field).toBeFocused();
	await field.fill('2h');
	await page.keyboard.press('Enter');
	await expect(card.getByRole('button', { name: 'Edit logged time, 2h' })).toBeVisible();

	await page.getByRole('button', { name: 'Undo' }).click();
	await expect(card.getByRole('button', { name: 'Edit logged time, 5h' })).toBeVisible();
});

/**
 * A clock runs now, so neither the button nor its key offers to start one on a row from another
 * day - the timer attaches to that entry and would count into it. `e2e/timer.spec.ts` covers the
 * today side, where both do work.
 */
test('will not start a timer on a row from another day, by button or by key', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chrome', 'touch keeps both actions in the kebab');
	await page.goto(`/day/${SEEDED_DATE}`);

	const card = page.getByRole('article').filter({ hasText: 'Probavam' });
	await card.hover();
	await expect(page.getByRole('button', { name: 'Continue timer on this entry' })).toHaveCount(0);

	await card.focus();
	await page.keyboard.press('p');

	await expect(card.getByText('Tracking')).toHaveCount(0);
	await expect(page.getByRole('button', { name: 'Start timer' })).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('the app boots and renders its heading', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('heading', { name: 'Tracktive' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Add entry' })).toBeVisible();
});

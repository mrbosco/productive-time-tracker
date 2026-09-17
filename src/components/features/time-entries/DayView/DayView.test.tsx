import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { addDays, todayIso } from '@/lib/date';
import { SEEDED_DATE } from '@/mocks/handlers';
import { server } from '@/mocks/node';
import { DayView } from './DayView';

/**
 * The day screen's own story is US-1 and is covered through its parts. What is tested here is the
 * one behaviour that only exists once they are assembled: deleting an entry (R-12), where the card
 * asks, this screen confirms, and the toast that follows belongs to the screen rather than to a
 * navigation.
 */
function renderDay() {
	return renderWithProviders(<DayView session={testSession} date={SEEDED_DATE} />, {
		session: testSession,
		initialEntry: `/day/${SEEDED_DATE}`,
	});
}

/** Opens the first card's menu and answers `Delete` in it. */
async function askToDelete(user: ReturnType<typeof userEvent.setup>) {
	const menus = await screen.findAllByRole('button', { name: 'Entry actions' });
	await user.click(menus[0]);
	await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

	return screen.findByRole('dialog', { name: 'Delete this entry?' });
}

describe('DayView', () => {
	/** Design brief 4: the question names the entry, so it is answerable without dismissing it. */
	it('names the entry it is asking about (R-12)', async () => {
		const user = userEvent.setup();
		await renderDay();

		const dialog = await askToDelete(user);

		expect(dialog).toHaveTextContent('5h');
		expect(dialog).toHaveTextContent('Probavam');
	});

	/**
	 * `ConfirmDialog` asserts this standalone; this is the path that can break it. The menu returns
	 * focus to the kebab on close, on a timeout that runs after the dialog has already placed its
	 * own focus, and only the dialog's trap puts it back.
	 */
	it('opens with the safe choice focused, even coming from the menu (guidebook 18)', async () => {
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);

		expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
	});

	/**
	 * The card the dialog was opened from is the element Radix hands focus back to, and the
	 * optimistic removal unmounts it - so without somewhere to put focus it lands on the document
	 * and a keyboard user loses the day entirely.
	 */
	it('keeps focus on the day after the card it was opened from is gone (guidebook 18)', async () => {
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getAllByRole('article')).toHaveLength(2);
		});
		expect(screen.getByRole('link', { name: 'Add entry' })).toHaveFocus();
	});

	it('deletes the entry and confirms it on the day (R-12)', async () => {
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getAllByRole('article')).toHaveLength(2);
		});
		expect(await screen.findByRole('status')).toHaveTextContent('Entry deleted');
	});

	/**
	 * X-2's shortcuts. They are registered on this screen rather than globally because every one of
	 * them acts on the day or on its list, and `useHotkeys` is what keeps them from firing while a
	 * field, the editor or a dialog has focus - covered in `useHotkeys.test.tsx`, not repeated here.
	 */
	it('opens the entry form with n (X-2)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('n');

		await waitFor(() => {
			expect(router.state.location.pathname).toBe('/entries/new');
		});
	});

	it('steps a day at a time with the arrow keys (X-2, R-5)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('{ArrowRight}');

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${addDays(SEEDED_DATE, 1)}`);
		});
	});

	it('returns to today with t (X-2)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('t');

		await waitFor(() => {
			expect(router.state.location.pathname).toBe(`/day/${todayIso()}`);
		});
	});

	/** The roving tabindex, from the day's side: the keys choose a card and focus follows it. */
	it('moves between entries with the arrow keys (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');
		expect(cards[0]).toHaveFocus();

		await user.keyboard('{ArrowDown}');
		expect(cards[1]).toHaveFocus();

		await user.keyboard('{ArrowUp}');
		expect(cards[0]).toHaveFocus();
	});

	/** Clamped rather than wrapped: jumping from the last entry back to the first reads as a fault. */
	it('stops at the ends of the list rather than wrapping (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');
		await user.keyboard('{ArrowUp}');

		expect(cards[0]).toHaveFocus();
	});

	it('edits the focused entry with e (X-2, R-11)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');
		await user.keyboard('e');

		await waitFor(() => {
			expect(router.state.location.pathname).toMatch(/^\/entries\/\d+\/edit$/);
		});
	});

	/**
	 * The same dialog the menu opens, which is why US-4 put it on this screen rather than on the
	 * card: there is one question about one entry, however it was asked for.
	 */
	it('asks before deleting the focused entry with Delete (X-2, R-12)', async () => {
		const user = userEvent.setup();
		await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');
		await user.keyboard('{Delete}');

		expect(await screen.findByRole('dialog', { name: 'Delete this entry?' })).toBeInTheDocument();
	});

	/** A Mac keyboard has no Delete key to speak of, and both mean the same thing in a list. */
	it('takes Backspace for the same question (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');
		await user.keyboard('{Backspace}');

		expect(await screen.findByRole('dialog', { name: 'Delete this entry?' })).toBeInTheDocument();
	});

	it('does nothing with e or Delete before a card is chosen (X-2)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		await screen.findAllByRole('article');

		await user.keyboard('e');
		await user.keyboard('{Delete}');

		expect(router.state.location.pathname).toBe(`/day/${SEEDED_DATE}`);
		expect(screen.queryByRole('dialog', { name: 'Delete this entry?' })).not.toBeInTheDocument();
	});

	/** A-10, from the outside: the dialog is the confirmation, so declining has to delete nothing. */
	it('leaves the day alone when the question is declined', async () => {
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		await waitFor(() => {
			expect(screen.queryByRole('dialog', { name: 'Delete this entry?' })).not.toBeInTheDocument();
		});
		expect(screen.getAllByRole('article')).toHaveLength(3);
	});

	/**
	 * SPEC 4.2: "on failure the entry is restored and an error toast is shown". The row is put back
	 * by the hook; what this covers is that the screen says why, because unlike the entry form there
	 * is no banner here to carry it.
	 */
	it('puts the entry back and says so when the delete fails (SPEC 4.2, R-12)', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Delete' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the entry.');
		expect(screen.getAllByRole('article')).toHaveLength(3);
	});
});

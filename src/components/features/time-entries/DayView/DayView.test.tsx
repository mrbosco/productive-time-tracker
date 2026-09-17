import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { ACTIVITY_MONITOR } from '@/components/features/timer/useActivityMonitor';
import { AppLayout } from '@/components/shared/layouts/AppLayout';
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

/**
 * The day after the recorded one: empty, so it shows the empty state, and its yesterday is the day
 * the fixture describes.
 */
const EMPTY_DATE = addDays(SEEDED_DATE, 1);

function renderEmptyDay() {
	return renderWithProviders(<DayView session={testSession} date={EMPTY_DATE} />, {
		session: testSession,
		initialEntry: `/day/${EMPTY_DATE}`,
	});
}

/** Waits for the empty state, then answers its `Copy from yesterday`. */
async function copyYesterday(user: ReturnType<typeof userEvent.setup>) {
	await user.click(await screen.findByRole('button', { name: 'Copy from yesterday' }));
}

/**
 * Opens the menu of the card with the recorded note and answers `Delete` in it.
 *
 * By content rather than by position: the dialog names the entry, so the test needs the one that
 * has something to name, and which row that is depends on A-7's ordering rather than on anything
 * this is testing.
 */
async function askToDelete(user: ReturnType<typeof userEvent.setup>) {
	const cards = await screen.findAllByRole('article');
	const noted = cards.findIndex((card) => card.textContent?.includes('Probavam') === true);
	const menus = await screen.findAllByRole('button', { name: 'Entry actions' });
	await user.click(menus[noted]);
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

	/**
	 * The roving tabindex, from the day's side: Tab enters the list and the arrows move within it.
	 * Entering by clicking here, which is the same thing from the component's point of view - the
	 * card reports the focus it received and the day follows it.
	 */
	it('moves between entries with the arrow keys (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.click(cards[0]);
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

		await user.click(cards[0]);
		await user.keyboard('{ArrowUp}');

		expect(cards[0]).toHaveFocus();
	});

	/**
	 * The arrows belong to the list, not to the page. Bound unconditionally they took
	 * `preventDefault` with them and killed arrow-key scrolling for anyone who had not entered it.
	 */
	it('leaves the arrow keys alone until the list has focus (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.keyboard('{ArrowDown}');

		expect(cards[0]).not.toHaveFocus();
		expect(cards[1]).not.toHaveFocus();
	});

	it('edits the focused entry with e (X-2, R-11)', async () => {
		const user = userEvent.setup();
		const { router } = await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.click(cards[0]);
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
		const cards = await screen.findAllByRole('article');

		await user.click(cards[0]);
		await user.keyboard('{Delete}');

		expect(await screen.findByRole('dialog', { name: 'Delete this entry?' })).toBeInTheDocument();
	});

	/** A Mac keyboard has no Delete key to speak of, and both mean the same thing in a list. */
	it('takes Backspace for the same question (X-2)', async () => {
		const user = userEvent.setup();
		await renderDay();
		const cards = await screen.findAllByRole('article');

		await user.click(cards[0]);
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

	/**
	 * X-3. The mutation is tested on its own; what only exists once the screen is assembled is the
	 * one toast SPEC 10 asks for, and the four things it can say.
	 */
	it('copies yesterday onto an empty day and says how many (X-3)', async () => {
		const user = userEvent.setup();
		await renderEmptyDay();

		await copyYesterday(user);

		expect(await screen.findByRole('status')).toHaveTextContent('3 entries copied from yesterday');
		await waitFor(() => {
			expect(screen.getAllByRole('article')).toHaveLength(3);
		});
	});

	/** A partial copy put real entries on the day, so it is not reported as a failure. */
	it('names the failures when only some entries copied (X-3)', async () => {
		let attempt = 0;
		server.use(
			http.post('*/time_entries', () => {
				attempt += 1;

				return attempt === 1
					? new HttpResponse(null, { status: 500 })
					: HttpResponse.json({ data: { id: '1', type: 'time_entries', attributes: {} } }, { status: 201 });
			})
		);
		const user = userEvent.setup();
		await renderEmptyDay();

		await copyYesterday(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('2 entries copied, 1 failed');
	});

	it('says so rather than nothing when yesterday was empty (X-3)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<DayView session={testSession} date="2026-09-19" />, {
			session: testSession,
			initialEntry: '/day/2026-09-19',
		});

		await copyYesterday(user);

		expect(await screen.findByRole('status')).toHaveTextContent('Nothing was logged yesterday.');
	});

	/** Nothing was attempted, so this is the one outcome that is genuinely an error. */
	it('reports a source day it could not read (X-3)', async () => {
		const user = userEvent.setup();
		await renderEmptyDay();
		await screen.findByRole('button', { name: 'Copy from yesterday' });

		server.use(http.get('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		await copyYesterday(user);

		expect(await screen.findByRole('alert')).toHaveTextContent("Could not read yesterday's entries.");
	});

	/**
	 * X-4, assembled: starting a timer puts its entry on today, and that row is the one that says a
	 * timer is on it. Today rather than the recorded day, because that is where a timer's entry
	 * lands (SPEC 11, finding 1).
	 */
	it('marks the row a timer is running against (X-4)', async () => {
		const user = userEvent.setup();
		// Inside the app bar, because that is where a timer is started from and the two are one
		// screen: the pill and the row it marks read the same timer.
		await renderWithProviders(
			<AppLayout session={testSession}>
				<DayView session={testSession} date={todayIso()} />
			</AppLayout>,
			{ session: testSession, initialEntry: `/day/${todayIso()}` }
		);
		await screen.findByText('Nothing logged for this day yet.');

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));

		expect(await screen.findByText('Tracking')).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: 'Stop timer' }).length).toBeGreaterThan(0);
	});

	/**
	 * X-5 assembled: the monitor runs in the provider, the banner is drawn here, and the two only
	 * meet once a timer is actually running.
	 *
	 * `idleMinutes: 0` rather than a faked clock - the thresholds are configuration precisely so
	 * they can be turned down (guidebook 13, ADR-0008), and a test that advances fifteen minutes of
	 * fake time through a ticking elapsed clock is a slower way to learn the same thing.
	 */
	it('warns above the list when a running timer goes quiet (X-5)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(
			<AppLayout session={testSession} activityConfig={{ ...ACTIVITY_MONITOR, idleMinutes: 0, checkIntervalMs: 50 }}>
				<DayView session={testSession} date={todayIso()} />
			</AppLayout>,
			{ session: testSession, initialEntry: `/day/${todayIso()}` }
		);

		await user.click(await screen.findByRole('button', { name: 'Start timer' }));

		// By its words, not by its role: the running timer announces itself through a live region
		// too, so `findByRole('status')` would settle on whichever came first.
		expect(await screen.findByText(/we have not seen activity/)).toBeInTheDocument();
	});

	/** Nothing is discarded by the banner itself: it stops the timer and the sheet asks (X-5). */
	it('hands the idle minutes to the stop sheet rather than writing them off (X-5)', async () => {
		const user = userEvent.setup();
		await renderWithProviders(
			<AppLayout session={testSession} activityConfig={{ ...ACTIVITY_MONITOR, idleMinutes: 0, checkIntervalMs: 50 }}>
				<DayView session={testSession} date={todayIso()} />
			</AppLayout>,
			{ session: testSession, initialEntry: `/day/${todayIso()}` }
		);
		await user.click(await screen.findByRole('button', { name: 'Start timer' }));

		await user.click(await screen.findByRole('button', { name: 'Pause and discard idle time' }));

		expect(await screen.findByRole('dialog', { name: 'Save tracked time' })).toBeInTheDocument();
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

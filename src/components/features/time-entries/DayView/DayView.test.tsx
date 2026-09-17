import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { AppLayout } from '@/components/shared/layouts/AppLayout';
import { addDays, formatDayShort, todayIso } from '@/lib/date';
import { SEEDED_DATE } from '@/mocks/handlers';
import { server } from '@/mocks/node';
import { DayView } from './DayView';

/**
 * The day screen is covered through its parts. What is tested here is the one behaviour that only
 * exists once they are assembled: deleting an entry, where the card asks, this screen confirms, and
 * the toast that follows belongs to the screen rather than to a navigation.
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

/** The button and the toasts name the day they copy from rather than saying "yesterday", which on a
 * Monday would have meant the Sunday nobody worked. */
const SOURCE_DAY = formatDayShort(SEEDED_DATE);

function renderEmptyDay() {
	return renderWithProviders(<DayView session={testSession} date={EMPTY_DATE} />, {
		session: testSession,
		initialEntry: `/day/${EMPTY_DATE}`,
	});
}

/** Waits for the empty state, then answers its `Copy from yesterday`. */
async function copyYesterday(user: ReturnType<typeof userEvent.setup>) {
	await user.click(await screen.findByRole('button', { name: /^Copy from / }));
}

/**
 * Opens the menu of the card with the recorded note and answers `Delete` in it.
 *
 * By content rather than by position: the dialog names the entry, so the test needs the one that
 * has something to name, and which row that is depends on the day's ordering rather than on
 * anything this is testing.
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
	/** The question names the entry, so it is answerable without dismissing it. */
	it('names the entry it is asking about', async () => {
		const user = userEvent.setup();
		await renderDay();

		const dialog = await askToDelete(user);

		expect(dialog).toHaveTextContent('5h');
		expect(dialog).toHaveTextContent('Probavam');
	});

	/**
	 * The card the dialog was opened from is the element Radix hands focus back to, and the
	 * optimistic removal unmounts it - so without somewhere to put focus it lands on the document
	 * and a keyboard user loses the day entirely.
	 */
	it('keeps focus on the day after the card it was opened from is gone', async () => {
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Delete' }));

		await waitFor(() => {
			expect(screen.getAllByRole('article')).toHaveLength(2);
		});
		expect(screen.getByRole('link', { name: 'Add entry' })).toHaveFocus();
	});

	it('deletes the entry and confirms it on the day', async () => {
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
	 * The mutation is tested on its own; what only exists once the screen is assembled is the one
	 * toast it raises, and the four things it can say.
	 */
	it('copies yesterday onto an empty day and says how many', async () => {
		const user = userEvent.setup();
		await renderEmptyDay();

		await copyYesterday(user);

		expect(await screen.findByRole('status')).toHaveTextContent(`3 entries copied from ${SOURCE_DAY}`);
		await waitFor(() => {
			expect(screen.getAllByRole('article')).toHaveLength(3);
		});
	});

	/** A partial copy put real entries on the day, so it is not reported as a failure. */
	it('names the failures when only some entries copied', async () => {
		let attempt = 0;
		server.use(
			http.post('*/time_entries', () => {
				attempt += 1;

				return attempt === 1
					? new HttpResponse(null, { status: 500 })
					: HttpResponse.json(
							{ data: { id: '1', type: 'time_entries', attributes: { date: '2026-09-17', time: 0 } } },
							{ status: 201 }
						);
			})
		);
		const user = userEvent.setup();
		await renderEmptyDay();

		await copyYesterday(user);

		expect(await screen.findByRole('alert')).toHaveTextContent('2 entries copied, 1 failed');
	});

	it('says so rather than nothing when yesterday was empty', async () => {
		const user = userEvent.setup();
		await renderWithProviders(<DayView session={testSession} date="2026-09-19" />, {
			session: testSession,
			initialEntry: '/day/2026-09-19',
		});

		await copyYesterday(user);

		expect(await screen.findByRole('status')).toHaveTextContent(
			`Nothing was logged on ${formatDayShort(addDays('2026-09-19', -1))}.`
		);
	});

	/** Nothing was attempted, so this is the one outcome that is genuinely an error. */
	it('reports a source day it could not read', async () => {
		const user = userEvent.setup();
		await renderEmptyDay();
		await screen.findByRole('button', { name: /^Copy from / });

		server.use(http.get('*/time_entries', () => new HttpResponse(null, { status: 500 })));
		await copyYesterday(user);

		expect(await screen.findByRole('alert')).toHaveTextContent(`Could not read the entries for ${SOURCE_DAY}.`);
	});

	/**
	 * Assembled: starting a timer puts its entry on today, and that row is the one that says a timer
	 * is on it. Today rather than the recorded day, because that is where a timer's entry lands.
	 */
	it('marks the row a timer is running against', async () => {
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

	/** From the outside: the dialog is the confirmation, so declining has to delete nothing. */
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
	 * On failure the entry is restored and an error toast is shown. The row is put back by the hook;
	 * what this covers is that the screen says why, because unlike the entry form there is no banner
	 * here to carry it.
	 */
	it('puts the entry back and says so when the delete fails', async () => {
		server.use(http.delete('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		await renderDay();

		await askToDelete(user);
		await user.click(screen.getByRole('button', { name: 'Delete' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the entry.');
		expect(screen.getAllByRole('article')).toHaveLength(3);
	});
});

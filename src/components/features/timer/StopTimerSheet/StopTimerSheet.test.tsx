import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import type { StoppedTimer } from '@/components/features/timer/useTimer';
import { server } from '@/mocks/node';
import { StopTimerSheet } from './StopTimerSheet';

/** One of the recorded day's entries, so the sheet has a real entry to edit. */
const ENTRY_ID = '162903873';

/**
 * A timer started from the app bar: it created this entry, so the entry is the tracked time.
 *
 * The two instants are built from **local** parts rather than written with a fixed offset. A timer
 * runs at a moment, not on a calendar day, so the caption formats it in whoever is reading's own
 * zone (unlike an entry's `date`, which is kept out of UTC entirely) - and a fixture pinned to
 * `+02:00` therefore asserted 09:18 here and 07:18 on a CI runner in UTC. This reads as 09:18
 * anywhere, which is what the assertion is actually about.
 */
function localInstant(hour: number, minute: number): string {
	return new Date(2026, 8, 16, hour, minute, 0, 0).toISOString();
}

const stopped: StoppedTimer = {
	entryId: ENTRY_ID,
	startedAt: localInstant(9, 18),
	stoppedAt: localInstant(10, 0),
	loggedBefore: null,
	discardMinutes: 0,
};

/** A timer continued from a card: the entry already held 5h before this timer added to it. */
const stoppedAfterContinuing: StoppedTimer = { ...stopped, loggedBefore: 300 };

function renderSheet(onClose = () => undefined, which = stopped) {
	return renderWithProviders(<StopTimerSheet session={testSession} stopped={which} onClose={onClose} />, {
		session: testSession,
	});
}

/**
 * The field once the entry has arrived. It is rendered disabled and empty first - the sheet opens
 * the moment the timer stops and reads the entry a request later - so every test that types into it
 * has to wait for that, not merely for the element.
 */
async function durationField() {
	const field = await screen.findByRole('textbox', { name: 'Duration' });
	await waitFor(() => {
		expect(field).toBeEnabled();
	});

	return field;
}

describe('StopTimerSheet', () => {
	/**
	 * It edits rather than creates. `POST /timers` already made the entry and the stop already
	 * wrote the minutes onto it, so saving must not put a second entry on the day.
	 */
	it('saves by editing the entry the timer created, never creating one', async () => {
		const patched: { id: string; attributes: Record<string, unknown> }[] = [];
		const created = vi.fn();
		server.use(
			http.patch('*/time_entries/:id', async ({ request, params }) => {
				const body = (await request.json()) as { data?: { attributes?: Record<string, unknown> } };
				patched.push({ id: String(params.id), attributes: body.data?.attributes ?? {} });

				return HttpResponse.json({
					data: { id: String(params.id), type: 'time_entries', attributes: { date: '2026-09-17', time: 0 } },
				});
			}),
			http.post('*/time_entries', () => {
				created();

				return HttpResponse.json(
					{ data: { id: '1', type: 'time_entries', attributes: { date: '2026-09-17', time: 0 } } },
					{ status: 201 }
				);
			})
		);
		const onClose = vi.fn();
		const user = userEvent.setup();
		await renderSheet(onClose);
		const duration = await durationField();

		await user.clear(duration);
		await user.type(duration, '42m');
		await user.click(screen.getByRole('button', { name: 'Save entry' }));

		await waitFor(() => {
			expect(patched).toHaveLength(1);
		});
		expect(patched[0]).toMatchObject({ id: ENTRY_ID, attributes: { time: 42 } });
		expect(created).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});

	/**
	 * Discarding deletes the entry the timer created, because that entry is the tracked time -
	 * leaving it would put an unexplained row on the day instead.
	 */
	it('discards by deleting the entry the timer created', async () => {
		const deleted: string[] = [];
		server.use(
			http.delete('*/time_entries/:id', ({ params }) => {
				deleted.push(String(params.id));

				return new HttpResponse(null, { status: 204 });
			})
		);
		const onClose = vi.fn();
		const user = userEvent.setup();
		await renderSheet(onClose);
		await durationField();

		await user.click(screen.getByRole('button', { name: 'Discard' }));

		await waitFor(() => {
			expect(deleted).toEqual([ENTRY_ID]);
		});
		expect(onClose).toHaveBeenCalled();
	});

	/**
	 * The entry was there before the timer and will be there after it: discarding puts the minutes
	 * back rather than deleting work the timer never tracked. Getting this wrong would throw away
	 * five hours on a button labelled `Discard`.
	 */
	it('puts a continued entry back rather than deleting it', async () => {
		const patched: { id: string; attributes: Record<string, unknown> }[] = [];
		const deleted = vi.fn();
		server.use(
			http.patch('*/time_entries/:id', async ({ request, params }) => {
				const body = (await request.json()) as { data?: { attributes?: Record<string, unknown> } };
				patched.push({ id: String(params.id), attributes: body.data?.attributes ?? {} });

				return HttpResponse.json({
					data: { id: String(params.id), type: 'time_entries', attributes: { date: '2026-09-17', time: 0 } },
				});
			}),
			http.delete('*/time_entries/:id', () => {
				deleted();

				return new HttpResponse(null, { status: 204 });
			})
		);
		const onClose = vi.fn();
		const user = userEvent.setup();
		await renderSheet(onClose, stoppedAfterContinuing);
		await durationField();

		await user.click(screen.getByRole('button', { name: 'Discard' }));

		await waitFor(() => {
			expect(patched).toHaveLength(1);
		});
		expect(patched[0]).toMatchObject({ id: ENTRY_ID, attributes: { time: 300 } });
		expect(deleted).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
	});

	/**
	 * The whole of what "discard idle time" does: the subtraction happens here, before the
	 * save, so the number is still correctable and nothing has been decided for anyone.
	 */
	it('takes the idle minutes off what it prefills', async () => {
		await renderSheet(() => undefined, { ...stopped, discardMinutes: 15 });

		// The entry holds 5h; a quarter of an hour of it was nobody there.
		expect(await durationField()).toHaveValue('4h 45m');
		expect(screen.getByText(/less 15m idle/)).toBeInTheDocument();
	});

	it('says why when the save is refused, and stays open', async () => {
		server.use(http.patch('*/time_entries/:id', () => new HttpResponse(null, { status: 500 })));
		const onClose = vi.fn();
		const user = userEvent.setup();
		await renderSheet(onClose);
		await durationField();

		await user.click(screen.getByRole('button', { name: 'Save entry' }));

		expect(await screen.findByRole('alert')).toHaveTextContent('Could not save the entry. Try again.');
		expect(onClose).not.toHaveBeenCalled();
	});
});

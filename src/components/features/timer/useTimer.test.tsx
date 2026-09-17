import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import timerAlreadyStopped from '../../../../docs/api/samples/error-409-timer-already-stopped.json';
import timerCreate from '../../../../docs/api/samples/timer-create.json';
import { act, renderHook, renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { readTimerState, TIMER_STORAGE_KEY, writeTimerState } from '@/lib/storage';
import { server } from '@/mocks/node';
import { useElapsedSeconds } from './useTimer';

/**
 * The timer is exercised through its provider, because that is the only way anything uses it and
 * because the two are one behaviour: the query, the two mutations and what a refresh remembers.
 */
/** An entry of the recorded day, for continuing one that already has time on it. */
const CONTINUED_ENTRY = '162903873';

function renderTimer() {
	function Probe() {
		const timer = useTimerContext();

		return (
			<div>
				<span data-running={timer.running === null ? 'no' : 'yes'}>
					{timer.running === null ? 'idle' : `running ${timer.running.id}`}
				</span>
				<button
					type="button"
					onClick={() => {
						timer.start();
					}}
				>
					start
				</button>
				<button
					type="button"
					onClick={() => {
						timer.continueEntry(CONTINUED_ENTRY, 300);
					}}
				>
					continue
				</button>
				<button type="button" onClick={timer.stop}>
					stop
				</button>
				<span>{timer.stopped === null ? 'no stop' : `stopped ${timer.stopped.entryId}`}</span>
				<span>{timer.needsService ? 'needs service' : 'has service'}</span>
			</div>
		);
	}

	return renderWithProviders(<Probe />, { session: testSession });
}

describe('useTimer, through its provider', () => {
	it('opens idle when nothing is running', async () => {
		await renderTimer();

		expect(await screen.findByText('idle')).toBeInTheDocument();
	});

	/**
	 * Starting also creates the entry the stop will be written onto (SPEC 11), and the linked id
	 * comes back from nowhere but `GET /timers?include=time_entry` - so the hook refetches to learn
	 * it, and remembers it.
	 */
	it('starts a timer and remembers it across a refresh (X-4)', async () => {
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'start' }));

		await waitFor(() => {
			expect(screen.getByText(/^running /)).toBeInTheDocument();
		});
		await waitFor(() => {
			expect(readTimerState()?.entryId).toEqual(expect.any(String));
		});
	});

	/**
	 * The whole of X-4's `Continue`, and the thing the API tells apart by a relationship: a start
	 * carrying `time_entry` attaches to that entry rather than creating one
	 * (`docs/api/samples/timer-continue-entry-probe.txt`). No second row, and no note to copy.
	 */
	it('continues an existing entry rather than creating a second one (X-4)', async () => {
		const posted: { relationships?: Record<string, unknown> }[] = [];
		server.use(
			http.post('*/timers', async ({ request }) => {
				const body = (await request.json()) as { data: { relationships?: Record<string, unknown> } };
				posted.push(body.data);

				return HttpResponse.json(timerCreate, { status: 201 });
			})
		);
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'continue' }));

		await waitFor(() => {
			expect(posted).toHaveLength(1);
		});
		expect(posted[0].relationships).toEqual({
			// Dasherized, which is what Productive's own client sends and what was observed to work.
			time_entry: { data: { type: 'time-entries', id: CONTINUED_ENTRY } },
		});
	});

	/** A bare start is the other behaviour of the same endpoint: service and person, no entry. */
	it('starts a fresh entry with a service rather than an entry (X-4)', async () => {
		const posted: { relationships?: Record<string, unknown> }[] = [];
		server.use(
			http.post('*/timers', async ({ request }) => {
				const body = (await request.json()) as { data: { relationships?: Record<string, unknown> } };
				posted.push(body.data);

				return HttpResponse.json(timerCreate, { status: 201 });
			})
		);
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'start' }));

		await waitFor(() => {
			expect(posted).toHaveLength(1);
		});
		expect(Object.keys(posted[0].relationships ?? {})).toEqual(['service', 'person']);
	});

	it('stops a timer and hands the entry over to be described (X-4)', async () => {
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'start' }));
		await waitFor(() => {
			expect(screen.getByText(/^running /)).toBeInTheDocument();
		});

		await user.click(screen.getByRole('button', { name: 'stop' }));

		expect(await screen.findByText(/^stopped /)).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByText('idle')).toBeInTheDocument();
		});
		expect(readTimerState()).toBeNull();
	});

	/**
	 * SPEC 11 and api-client rule 19: the timer was stopped in another tab or in Productive itself.
	 * Telling someone their timer is still running would be the only wrong answer.
	 */
	it('treats an already-stopped timer as stopped rather than as a failure (X-4)', async () => {
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');
		await user.click(screen.getByRole('button', { name: 'start' }));
		await waitFor(() => {
			expect(screen.getByText(/^running /)).toBeInTheDocument();
		});

		server.use(http.put('*/timers/:id/stop', () => HttpResponse.json(timerAlreadyStopped, { status: 409 })));
		await user.click(screen.getByRole('button', { name: 'stop' }));

		expect(await screen.findByText(/^stopped /)).toBeInTheDocument();
		await waitFor(() => {
			expect(screen.getByText('idle')).toBeInTheDocument();
		});
	});

	/**
	 * A stored timer stands in only while the query is pending. Once the API says nothing is
	 * running, what was remembered is stale and is forgotten rather than shown.
	 */
	it('drops a remembered timer the API says is no longer running (X-4)', async () => {
		writeTimerState({ timerId: '14335645', startedAt: new Date().toISOString(), entryId: '163018789' });
		await renderTimer();

		expect(await screen.findByText('idle')).toBeInTheDocument();
		await waitFor(() => {
			expect(window.localStorage.getItem(TIMER_STORAGE_KEY)).toBeNull();
		});
	});

	/** A-1: a timer is logged against the default service, and there is nowhere else to choose one. */
	it('asks for a default service rather than starting without one (A-1)', async () => {
		server.use(http.get('*/services', () => HttpResponse.json({ data: [], meta: { total_pages: 0 } })));
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'start' }));

		expect(await screen.findByText('needs service')).toBeInTheDocument();
		expect(screen.getByText('idle')).toBeInTheDocument();
	});
});

/** No provider: it takes an instant and returns a number, and a timer is not needed to test that. */
describe('useElapsedSeconds', () => {
	/**
	 * From the instant the timer started, not from mount - a timer restored after a refresh is
	 * already minutes old, and starting the count at zero would say it had just begun.
	 */
	it('counts from the moment the timer started, not from mount', () => {
		vi.useFakeTimers();
		try {
			const startedAt = new Date(Date.now() - 90_000).toISOString();
			const { result } = renderHook(() => useElapsedSeconds(startedAt));

			expect(result.current).toBe(90);

			act(() => {
				vi.advanceTimersByTime(2000);
			});

			expect(result.current).toBe(92);
		} finally {
			vi.useRealTimers();
		}
	});

	it('reads zero while nothing is running', () => {
		const { result } = renderHook(() => useElapsedSeconds(null));

		expect(result.current).toBe(0);
	});
});

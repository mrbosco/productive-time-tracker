import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import timerAlreadyStopped from '../../../../docs/api/samples/error-409-timer-already-stopped.json';
import { act, renderHook, renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { readTimerState, TIMER_STORAGE_KEY, writeTimerState } from '@/lib/storage';
import { server } from '@/mocks/node';
import { useElapsedSeconds } from './useTimer';

/**
 * The timer is exercised through its provider, because that is the only way anything uses it and
 * because the two are one behaviour: the query, the two mutations and what a refresh remembers.
 */
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
						timer.start('<p>Standup</p>');
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

	/** X-3's Continue: one PATCH, so the running `0h` row already says what it is for. */
	it('writes the continued note onto the entry the start created (X-4)', async () => {
		const patched: { id: string; note: unknown }[] = [];
		server.use(
			http.patch('*/time_entries/:id', async ({ request, params }) => {
				const body = (await request.json()) as { data?: { attributes?: { note?: unknown } } };
				patched.push({ id: String(params.id), note: body.data?.attributes?.note });

				return HttpResponse.json({ data: { id: String(params.id), type: 'time_entries', attributes: {} } });
			})
		);
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'continue' }));

		await waitFor(() => {
			expect(patched).toHaveLength(1);
		});
		expect(patched[0].note).toBe('<p>Standup</p>');
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

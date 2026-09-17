import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import timerAlreadyStopped from '../../../../docs/api/samples/error-409-timer-already-stopped.json';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { useTimerContext } from '@/components/features/timer/TimerProvider';
import { readTimerState } from '@/lib/storage';
import { server } from '@/mocks/node';

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
				<span>{timer.error ?? 'no error'}</span>
			</div>
		);
	}

	return renderWithProviders(<Probe />, { session: testSession });
}

describe('useTimer, through its provider', () => {
	/**
	 * Starting also creates the entry the stop will be written onto, and the linked id
	 * comes back from nowhere but `GET /timers?include=time_entry` - so the hook refetches to learn
	 * it, and remembers it.
	 */
	it('starts a timer and remembers it across a refresh', async () => {
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

	it('stops a timer and hands the entry over to be described', async () => {
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
	 * Recorded behaviour (api-client rule 19): the timer was stopped in another tab or in Productive
	 * Telling someone their timer is still running would be the only wrong answer.
	 */
	it('treats an already-stopped timer as stopped rather than as a failure', async () => {
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
	 * A failure is reported where the user is standing. These three rejected into nothing
	 * before - `mutateAsync` throws, the context calls them as `void start()`, and `void` is exactly
	 * what stops `no-floating-promises` from noticing.
	 */
	it('says so when a timer will not start', async () => {
		server.use(http.post('*/timers', () => new HttpResponse(null, { status: 500 })));
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'start' }));

		expect(await screen.findByText('Could not start the timer. Try again.')).toBeInTheDocument();
		expect(screen.getByText('idle')).toBeInTheDocument();
	});

	it('says so when an entry will not continue', async () => {
		server.use(http.post('*/timers', () => new HttpResponse(null, { status: 422 })));
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');

		await user.click(screen.getByRole('button', { name: 'continue' }));

		expect(await screen.findByText('Could not continue this entry. Try again.')).toBeInTheDocument();
	});

	/** A 409 is "already stopped" and is not a failure; anything else is, and has to say so. */
	it('says so when a timer will not stop', async () => {
		const user = userEvent.setup();
		await renderTimer();
		await screen.findByText('idle');
		await user.click(screen.getByRole('button', { name: 'start' }));
		await waitFor(() => {
			expect(screen.getByText(/^running /)).toBeInTheDocument();
		});

		server.use(http.put('*/timers/:id/stop', () => new HttpResponse(null, { status: 500 })));
		await user.click(screen.getByRole('button', { name: 'stop' }));

		expect(await screen.findByText('Could not stop the timer. Try again.')).toBeInTheDocument();
		// Still running, because it is: nothing was stopped and nothing pretends otherwise.
		expect(screen.getByText(/^running /)).toBeInTheDocument();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimerControl } from './TimerControl';

const running = { id: '14335645', startedAt: new Date(Date.now() - 42_000).toISOString(), entryId: '163018789' };
const noop = () => undefined;

describe('TimerControl', () => {
	it('offers to start one while nothing is running', async () => {
		await renderWithProviders(<TimerControl running={null} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getByRole('button', { name: 'Start timer' })).toBeInTheDocument();
	});

	it('starts one when asked', async () => {
		const onStart = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimerControl running={null} isBusy={false} onStart={onStart} onStop={noop} />);

		await user.click(screen.getByRole('button', { name: 'Start timer' }));

		expect(onStart).toHaveBeenCalledTimes(1);
	});

	/**
	 * The elapsed clock is in the accessible name rather than beside it: "Stop timer" alone would
	 * not say what is running, and a screen reader would never reach the number (guidebook 18).
	 */
	it('shows the elapsed time and says it out loud (X-4)', async () => {
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getByRole('button', { name: 'Stop timer, 0:42 elapsed' })).toBeInTheDocument();
		expect(screen.getByText('0:42')).toBeInTheDocument();
	});

	it('stops one when asked', async () => {
		const onStop = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={onStop} />);

		await user.click(screen.getByRole('button', { name: /^Stop timer/ }));

		expect(onStop).toHaveBeenCalledTimes(1);
	});

	/** A start and a stop are both one request; pressing either twice would send two. */
	it('cannot be pressed while a start or a stop is in flight', async () => {
		await renderWithProviders(<TimerControl running={null} isBusy onStart={noop} onStop={noop} />);

		expect(screen.getByRole('button', { name: 'Start timer' })).toBeDisabled();
	});

	/**
	 * The tab strip is the one place a browser shows a running timer without being looked at, which
	 * is the whole of the competitive analysis's finding: all three products make the running state
	 * visible from wherever you are.
	 */
	it('mirrors the elapsed time into the document title (X-4)', async () => {
		document.title = 'Time Tracker';
		const { unmount } = await renderWithProviders(
			<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />
		);

		expect(document.title).toBe('0:42 · Time Tracker');

		unmount();

		expect(document.title).toBe('Time Tracker');
	});

	it('leaves the document title alone while nothing is running', async () => {
		document.title = 'Time Tracker';
		await renderWithProviders(<TimerControl running={null} isBusy={false} onStart={noop} onStop={noop} />);

		expect(document.title).toBe('Time Tracker');
	});
});

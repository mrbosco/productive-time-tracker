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

	it('shows the elapsed time (X-4)', async () => {
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getByText('42s')).toBeInTheDocument();
	});

	/**
	 * `Timer.dc.html`'s build note: the stop button's name is fixed and the running state is
	 * announced once. A name carrying the clock would be re-announced every second, which turns a
	 * timer into a screen reader talking over whatever the user is doing.
	 */
	it('keeps the ticking clock out of the accessible name (X-4)', async () => {
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getByRole('button', { name: 'Stop timer' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Timer running');
	});

	/**
	 * The design's central point here: status on the left, action on the right, and only the action
	 * pressable. The pill used to be one big button with two flat glyphs in it, so neither read as
	 * the control and the whole thing was clickable by accident.
	 */
	it('offers exactly one pressable thing while running (X-4)', async () => {
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getAllByRole('button')).toHaveLength(1);
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

		expect(document.title).toBe('42s · Time Tracker');

		unmount();

		expect(document.title).toBe('Time Tracker');
	});

	it('leaves the document title alone while nothing is running', async () => {
		document.title = 'Time Tracker';
		await renderWithProviders(<TimerControl running={null} isBusy={false} onStart={noop} onStop={noop} />);

		expect(document.title).toBe('Time Tracker');
	});
});

import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { ActivityBanner } from './ActivityBanner';

const noop = () => undefined;
const idle = { reason: 'idle', minutes: 15 } as const;

describe('ActivityBanner', () => {
	/**
	 * ADR-0008: "false positives acknowledged in the UI copy". It says what was observed - no input
	 * events - rather than making a claim about a person, who may have been reading.
	 */
	it('says what was not seen rather than what someone was doing (X-5)', async () => {
		await renderWithProviders(<ActivityBanner concern={idle} onDiscard={noop} onKeepRunning={noop} />);

		expect(screen.getByRole('status')).toHaveTextContent('The timer is running but we have not seen activity for 15m.');
	});

	it('offers both answers, and acts on neither by itself', async () => {
		await renderWithProviders(<ActivityBanner concern={idle} onDiscard={noop} onKeepRunning={noop} />);

		expect(screen.getByRole('button', { name: 'Pause and discard idle time' })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Keep running' })).toBeInTheDocument();
	});

	it('discards the idle time when asked', async () => {
		const onDiscard = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<ActivityBanner concern={idle} onDiscard={onDiscard} onKeepRunning={noop} />);

		await user.click(screen.getByRole('button', { name: 'Pause and discard idle time' }));

		expect(onDiscard).toHaveBeenCalledTimes(1);
	});

	it('takes both Keep running and the dismiss icon as "I am here"', async () => {
		const onKeepRunning = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<ActivityBanner concern={idle} onDiscard={noop} onKeepRunning={onKeepRunning} />);

		await user.click(screen.getByRole('button', { name: 'Keep running' }));
		await user.click(screen.getByRole('button', { name: 'Dismiss' }));

		expect(onKeepRunning).toHaveBeenCalledTimes(2);
	});

	/** The flagged-off heuristic still has to say something honest when it is turned on. */
	it('describes automated-looking input as exactly that (X-5)', async () => {
		await renderWithProviders(
			<ActivityBanner concern={{ reason: 'synthetic', minutes: 20 }} onDiscard={noop} onKeepRunning={noop} />
		);

		expect(screen.getByRole('status')).toHaveTextContent('the only activity has looked automated');
	});

	/**
	 * `status`, not `alert`: worth announcing when it arrives, and not worth interrupting whatever a
	 * screen reader was in the middle of saying.
	 */
	it('announces itself without interrupting (guidebook 18)', async () => {
		await renderWithProviders(<ActivityBanner concern={idle} onDiscard={noop} onKeepRunning={noop} />);

		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(screen.getByRole('status')).toBeInTheDocument();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { ActivityBanner } from './ActivityBanner';

const noop = () => undefined;
const idle = { reason: 'idle', minutes: 15 } as const;

describe('ActivityBanner', () => {
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
});

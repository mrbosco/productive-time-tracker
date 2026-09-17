import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimerControl } from './TimerControl';

const running = { id: '14335645', startedAt: new Date(Date.now() - 42_000).toISOString(), entryId: '163018789' };
const noop = () => undefined;

describe('TimerControl', () => {
	it('starts one when asked', async () => {
		const onStart = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimerControl running={null} isBusy={false} onStart={onStart} onStop={noop} />);

		await user.click(screen.getByRole('button', { name: 'Start timer' }));

		expect(onStart).toHaveBeenCalledTimes(1);
	});

	it('shows the elapsed time', async () => {
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={noop} />);

		expect(screen.getByText('42s')).toBeInTheDocument();
	});

	it('stops one when asked', async () => {
		const onStop = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimerControl running={running} isBusy={false} onStart={noop} onStop={onStop} />);

		await user.click(screen.getByRole('button', { name: /^Stop timer/ }));

		expect(onStop).toHaveBeenCalledTimes(1);
	});
});

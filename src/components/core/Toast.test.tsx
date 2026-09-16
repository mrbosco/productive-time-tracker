import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { Toast } from './Toast';

afterEach(() => {
	vi.useRealTimers();
});

describe('Toast', () => {
	it('announces the confirmation politely rather than interrupting', () => {
		render(<Toast onDismiss={() => undefined}>Entry saved</Toast>);

		expect(screen.getByRole('status')).toHaveTextContent('Entry saved');
	});

	it('dismisses itself once the message has had time to be read', () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		render(<Toast onDismiss={onDismiss}>Entry saved</Toast>);

		expect(onDismiss).not.toHaveBeenCalled();

		vi.advanceTimersByTime(2600);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	/**
	 * Callers pass an inline arrow, so a new one arrives on every parent render. If the timer
	 * depended on it, a screen that re-renders - the day view does, on every query settle - would
	 * keep restarting the countdown and the toast would never leave.
	 */
	it('keeps counting down across a re-render that changes the handler', () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		const { rerender } = render(
			<Toast
				onDismiss={() => {
					onDismiss();
				}}
			>
				Entry saved
			</Toast>
		);

		vi.advanceTimersByTime(1500);
		rerender(
			<Toast
				onDismiss={() => {
					onDismiss();
				}}
			>
				Entry saved
			</Toast>
		);
		vi.advanceTimersByTime(1500);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});

	it('calls the handler the latest render gave it, not a stale one', () => {
		vi.useFakeTimers();
		const stale = vi.fn();
		const fresh = vi.fn();
		const { rerender } = render(<Toast onDismiss={stale}>Entry saved</Toast>);

		rerender(<Toast onDismiss={fresh}>Entry saved</Toast>);
		vi.advanceTimersByTime(2600);

		expect(stale).not.toHaveBeenCalled();
		expect(fresh).toHaveBeenCalledTimes(1);
	});

	it('restarts for a new message', () => {
		vi.useFakeTimers();
		const onDismiss = vi.fn();
		const { rerender } = render(<Toast onDismiss={onDismiss}>Entry saved</Toast>);

		vi.advanceTimersByTime(2000);
		rerender(<Toast onDismiss={onDismiss}>Entry deleted</Toast>);
		vi.advanceTimersByTime(2000);

		expect(onDismiss).not.toHaveBeenCalled();

		vi.advanceTimersByTime(600);

		expect(onDismiss).toHaveBeenCalledTimes(1);
	});
});

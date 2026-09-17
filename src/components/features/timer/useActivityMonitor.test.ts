import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@/__tests__/test-utils';
import { type ActivityMonitorConfig, useActivityMonitor } from './useActivityMonitor';

/**
 * A minute of idleness and a four-second check, so a test can reach the threshold without waiting
 * fifteen minutes of fake clock. That the numbers are parameters at all is what makes that
 * ADR-0008 - the defaults are the product's, not the code's.
 */
const CONFIG: ActivityMonitorConfig = {
	idleMinutes: 1,
	detectSyntheticInput: false,
	cvThreshold: 0.15,
	displacementPx: 3,
	windowSize: 60,
	minimumSamples: 12,
	checkIntervalMs: 4000,
};

function move(x = 500, y = 400) {
	act(() => {
		window.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y }));
	});
}

/** Pushes the clock past the idle threshold and lets the interval fire. */
function waitOutTheThreshold(minutes = 2) {
	act(() => {
		vi.advanceTimersByTime(minutes * 60_000);
	});
}

describe('useActivityMonitor', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('speaks up once nothing has happened for long enough', () => {
		const { result } = renderHook(() => useActivityMonitor(true, CONFIG));

		waitOutTheThreshold();

		expect(result.current.concern).toEqual({ reason: 'idle', minutes: 2 });
	});

	/**
	 * Activity restarts the clock but does not retract a question already asked. Clearing it on
	 * `pointermove` made the banner unreachable - it vanished under the cursor on the way to its own
	 * button - and it was the wrong idea anyway: "we have not seen activity for fifteen minutes" is
	 * about the past, and being here now does not make it untrue.
	 */
	it('does not take back a question just because the mouse moved', () => {
		const { result } = renderHook(() => useActivityMonitor(true, CONFIG));
		waitOutTheThreshold();

		move();

		expect(result.current.concern).not.toBeNull();
	});

	it('restarts the clock on activity, so a fresh idle spell has to pass again', () => {
		const { result } = renderHook(() => useActivityMonitor(true, CONFIG));

		act(() => {
			vi.advanceTimersByTime(50_000);
		});
		move();
		act(() => {
			vi.advanceTimersByTime(50_000);
		});

		expect(result.current.concern).toBeNull();
	});

	/** Time spent away is not idleness either, so coming back forgives it rather than reporting it. */
	it('forgives the time the tab spent hidden', () => {
		const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		const { result } = renderHook(() => useActivityMonitor(true, CONFIG));
		waitOutTheThreshold(10);

		visibility.mockReturnValue('visible');
		act(() => {
			document.dispatchEvent(new Event('visibilitychange'));
			vi.advanceTimersByTime(4000);
		});

		expect(result.current.concern).toBeNull();
		visibility.mockRestore();
	});

	/**
	 * The heuristic is off unless someone turns it on (ADR-0008). A metronome of pointer moves keeps
	 * the idle clock at zero, so with the flag down there is nothing to say about it at all.
	 */
	it('says nothing about automated-looking input while the flag is down', () => {
		const { result } = renderHook(() => useActivityMonitor(true, CONFIG));

		for (let index = 0; index < 40; index += 1) {
			move(500 + (index % 2), 400);
			act(() => {
				vi.advanceTimersByTime(1000);
			});
		}

		expect(result.current.concern).toBeNull();
	});

	it('raises it as its own kind of concern once the flag is up', () => {
		const { result } = renderHook(() => useActivityMonitor(true, { ...CONFIG, detectSyntheticInput: true }));

		for (let index = 0; index < 40; index += 1) {
			move(500 + (index % 2), 400);
			act(() => {
				vi.advanceTimersByTime(1000);
			});
		}

		expect(result.current.concern?.reason).toBe('synthetic');
	});
});

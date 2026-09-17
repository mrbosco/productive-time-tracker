import { useEffect, useRef, useState } from 'react';
import { type ActivitySample, looksSynthetic } from '@/lib/activity';

/** `detectSyntheticInput` is **off** by default: a product decision, not an oversight. The
 * heuristic is built and tested so it is reversible - flipping this to `true` is the whole of it. */
export interface ActivityMonitorConfig {
	idleMinutes: number;
	detectSyntheticInput: boolean;
	cvThreshold: number;
	displacementPx: number;
	windowSize: number;
	minimumSamples: number;
	checkIntervalMs: number;
}

export const ACTIVITY_MONITOR: ActivityMonitorConfig = {
	idleMinutes: 15,
	detectSyntheticInput: false,
	cvThreshold: 0.15,
	displacementPx: 3,
	windowSize: 60,
	minimumSamples: 12,
	checkIntervalMs: 30_000,
};

export interface ActivityConcern {
	reason: 'idle' | 'synthetic';
	/** Whole minutes the concern covers, and what `Pause and discard idle time` would take off. For
	 * `synthetic` that is the suspicious window, since a jiggler keeps idle time at zero. */
	minutes: number;
}

const WATCHED = ['pointermove', 'keydown', 'wheel', 'click'] as const;

/** Watches for the timer running on its own. The `visibilityState === 'visible'` gate is load-bearing:
 * a background tab receives no input events, so counting idleness while hidden would accuse everyone
 * who switched windows. Nothing here reaches the network or stops a timer; it raises a concern. */
export function useActivityMonitor(
	isRunning: boolean,
	config: ActivityMonitorConfig = ACTIVITY_MONITOR
): { concern: ActivityConcern | null; acknowledge: () => void } {
	/* Destructured so the effect depends on the values, not `config` itself: a caller passing a
	 * literal would rebuild the watch every render and empty the sample window. */
	const { idleMinutes, detectSyntheticInput, cvThreshold, displacementPx, windowSize, minimumSamples } = config;
	const { checkIntervalMs } = config;
	const [concern, setConcern] = useState<ActivityConcern | null>(null);
	// Zero rather than `Date.now()`: reading the clock during render is a side effect, and the
	// effect below sets it to the moment the watch actually starts, which is the honest reading.
	const lastActivity = useRef(0);
	const samples = useRef<ActivitySample[]>([]);

	useEffect(() => {
		if (!isRunning) return;

		lastActivity.current = Date.now();
		samples.current = [];

		/* Deliberately does **not** clear a concern already raised: moving the mouse towards the banner
		 * is a `pointermove`, so it vanished under the cursor on the way to the button. */
		function record(event: Event) {
			lastActivity.current = Date.now();

			const pointer = event instanceof PointerEvent ? event : null;
			samples.current = [
				...samples.current.slice(-(windowSize - 1)),
				{
					at: lastActivity.current,
					x: pointer?.clientX ?? 0,
					y: pointer?.clientY ?? 0,
					isPointer: event.type === 'pointermove',
				},
			];
		}

		// Time away is not idleness: push the clock forward rather than raise a concern for it.
		function onVisibilityChange() {
			if (document.visibilityState === 'visible') lastActivity.current = Date.now();
		}

		for (const type of WATCHED) window.addEventListener(type, record, { passive: true });
		document.addEventListener('visibilitychange', onVisibilityChange);

		const check = setInterval(() => {
			if (document.visibilityState !== 'visible') return;

			const minutes = Math.floor((Date.now() - lastActivity.current) / 60_000);
			if (minutes >= idleMinutes) {
				setConcern({ reason: 'idle', minutes });

				return;
			}

			if (
				detectSyntheticInput &&
				looksSynthetic(samples.current, { cvThreshold, displacementPx, windowSize, minimumSamples })
			) {
				const window = samples.current;
				const span = Math.floor((window[window.length - 1].at - window[0].at) / 60_000);
				setConcern({ reason: 'synthetic', minutes: span });
			}
		}, checkIntervalMs);

		return () => {
			for (const type of WATCHED) window.removeEventListener(type, record);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			clearInterval(check);
			setConcern(null);
		};
	}, [
		isRunning,
		idleMinutes,
		detectSyntheticInput,
		cvThreshold,
		displacementPx,
		windowSize,
		minimumSamples,
		checkIntervalMs,
	]);

	return {
		// Guarded as well as cleared on teardown: the render in which the timer stops happens before
		// the cleanup that clears the concern.
		concern: isRunning ? concern : null,
		acknowledge: () => {
			lastActivity.current = Date.now();
			samples.current = [];
			setConcern(null);
		},
	};
}

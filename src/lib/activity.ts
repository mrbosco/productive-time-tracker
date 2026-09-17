/** Does this stream of pointer events look like it was produced by a program rather than a hand? A
 * mouse jiggler moves on a metronome and barely moves at all - regular intervals, near-zero
 * displacement, never a key, wheel or click. A heuristic, off by default: it only raises the same
 * banner idleness raises, and no timer is ever stopped by it. */

/** One input event, reduced to what the heuristic reads. */
export interface ActivitySample {
	/** `Date.now()` when it arrived. */
	at: number;
	x: number;
	y: number;
	/** A key, wheel or click is evidence of a person, so one anywhere in the window settles it. */
	isPointer: boolean;
}

export interface SyntheticThresholds {
	/** Coefficient of variation of the intervals, below which they are suspiciously regular. */
	cvThreshold: number;
	/** Median distance between consecutive points, below which nothing is really moving. */
	displacementPx: number;
	/** How many of the most recent samples to judge, and the fewest worth judging at all. */
	windowSize: number;
	minimumSamples: number;
}

function median(values: number[]): number {
	if (values.length === 0) return 0;

	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);

	return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Standard deviation over the mean, which is what makes this comparable across rates: a jiggler
 * ticking every 100ms and one ticking every 2s are both regular, but raw deviation would call only
 * the slow one steady. */
function coefficientOfVariation(values: number[]): number {
	if (values.length === 0) return Number.POSITIVE_INFINITY;

	const mean = values.reduce((total, value) => total + value, 0) / values.length;
	// Every event at the same instant is a burst, not a rhythm - and dividing by it is worse.
	if (mean <= 0) return Number.POSITIVE_INFINITY;

	const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;

	return Math.sqrt(variance) / mean;
}

/** Whether the tail of `samples` looks machine-made. Both conditions must hold, and that conjunction
 * is the whole of the conservatism: regular intervals alone describe dragging a scrollbar, tiny
 * movements alone describe a hand resting on a trackpad. Deliberately false on thin evidence - a
 * false positive here accuses someone of faking their timesheet. */
export function looksSynthetic(samples: ActivitySample[], thresholds: SyntheticThresholds): boolean {
	const window = samples.slice(-thresholds.windowSize);
	if (window.length < thresholds.minimumSamples) return false;
	if (window.some((sample) => !sample.isPointer)) return false;

	const intervals: number[] = [];
	const displacements: number[] = [];
	for (let index = 1; index < window.length; index += 1) {
		const previous = window[index - 1];
		const current = window[index];
		intervals.push(current.at - previous.at);
		displacements.push(Math.hypot(current.x - previous.x, current.y - previous.y));
	}

	return (
		coefficientOfVariation(intervals) < thresholds.cvThreshold && median(displacements) < thresholds.displacementPx
	);
}

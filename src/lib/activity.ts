/**
 * The synthetic-input heuristic behind X-5's config flag (SPEC 10, ADR-0008).
 *
 * It answers one narrow question: does this stream of pointer events look like it was produced by
 * a program rather than by a hand? A mouse jiggler moves the cursor on a metronome and barely moves
 * it at all - regular intervals, near-zero displacement, and never a key, a wheel or a click. A
 * person is irregular at every scale.
 *
 * It is a heuristic and is treated as one everywhere: it is off by default, it only ever raises the
 * same banner idleness raises, nothing is sent to the API, and no timer is ever stopped by it.
 * ADR-0008 has the reasoning - Harvest and Toggl both position themselves against input monitoring,
 * and this is a client-facing product.
 *
 * Pure, and separate from the hook, so the thresholds can be exercised against a stream without a
 * DOM, a clock or a timer.
 */

/** One input event, reduced to what the heuristic reads. */
export interface ActivitySample {
	/** `Date.now()` when it arrived. */
	at: number;
	x: number;
	y: number;
	/**
	 * Pointer movement is the only kind worth suspecting: a key, a wheel or a click is evidence of
	 * a person, so one anywhere in the window settles the question.
	 */
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

/**
 * The coefficient of variation - standard deviation over the mean - which is what makes this
 * comparable across rates. A jiggler ticking every 100ms and one ticking every 2s are both regular;
 * the raw deviation would call only the slow one steady.
 */
function coefficientOfVariation(values: number[]): number {
	if (values.length === 0) return Number.POSITIVE_INFINITY;

	const mean = values.reduce((total, value) => total + value, 0) / values.length;
	// Every event at the same instant is not a rhythm, it is a burst - and dividing by it is worse.
	if (mean <= 0) return Number.POSITIVE_INFINITY;

	const variance = values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length;

	return Math.sqrt(variance) / mean;
}

/**
 * Whether the tail of `samples` looks machine-made.
 *
 * Both conditions must hold, and that conjunction is the whole of the conservatism: regular
 * intervals alone describe someone dragging a scrollbar, and tiny movements alone describe someone
 * resting a hand on a trackpad. Together they describe something with no hand in it.
 *
 * Deliberately false on too little evidence. A handful of events is not a pattern, and the cost of
 * a false positive here is a banner accusing someone of faking their timesheet.
 */
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

import { describe, expect, it } from 'vitest';
import { type ActivitySample, looksSynthetic, type SyntheticThresholds } from './activity';

const THRESHOLDS: SyntheticThresholds = { cvThreshold: 0.15, displacementPx: 3, windowSize: 60, minimumSamples: 12 };

/**
 * The two streams the heuristic has to tell apart (ADR-0008).
 *
 * Generated rather than captured, and deterministically so the thresholds are exercised against the
 * same numbers on every run. The shapes are what matters: a jiggler is a metronome that barely
 * moves, and a hand is irregular at every scale - which is the distinction the coefficient of
 * variation exists to measure.
 */
function syntheticStream(count = 60, intervalMs = 1000, pixels = 1): ActivitySample[] {
	return Array.from({ length: count }, (_, index) => ({
		at: index * intervalMs,
		// Back and forth across a couple of pixels, which is what keeps a screen awake.
		x: 500 + (index % 2) * pixels,
		y: 400,
		isPointer: true,
	}));
}

/**
 * A hand, approximated: intervals that wander between 30ms and 260ms and movements of tens of
 * pixels. `pseudoRandom` rather than `Math.random`, so a failure is reproducible.
 */
function humanStream(count = 60): ActivitySample[] {
	let seed = 42;
	const pseudoRandom = () => {
		seed = (seed * 1103515245 + 12345) % 2147483648;

		return seed / 2147483648;
	};

	let at = 0;
	let x = 500;
	let y = 400;

	return Array.from({ length: count }, () => {
		at += 30 + Math.round(pseudoRandom() * 230);
		x += Math.round((pseudoRandom() - 0.5) * 80);
		y += Math.round((pseudoRandom() - 0.5) * 60);

		return { at, x, y, isPointer: true };
	});
}

describe('looksSynthetic', () => {
	it('recognises a metronome that barely moves', () => {
		expect(looksSynthetic(syntheticStream(), THRESHOLDS)).toBe(true);
	});

	it('leaves a hand alone', () => {
		expect(looksSynthetic(humanStream(), THRESHOLDS)).toBe(false);
	});

	/**
	 * Both conditions, not either: regular intervals alone describe someone dragging a scrollbar,
	 * and tiny movements alone describe a hand resting on a trackpad.
	 */
	it('is not fooled by regular intervals alone', () => {
		const pacedButMoving = syntheticStream().map((sample, index) => ({ ...sample, x: 500 + index * 25 }));

		expect(looksSynthetic(pacedButMoving, THRESHOLDS)).toBe(false);
	});

	it('is not fooled by small movements alone', () => {
		const stillButIrregular = humanStream().map((sample) => ({ ...sample, x: 500, y: 400 }));

		expect(looksSynthetic(stillButIrregular, THRESHOLDS)).toBe(false);
	});

	/** A key, a wheel or a click is evidence of a person, and one is enough to settle it. */
	it('stops suspecting the moment a key is pressed', () => {
		const withAKeystroke = [...syntheticStream(), { at: 60_000, x: 500, y: 400, isPointer: false }];

		expect(looksSynthetic(withAKeystroke, THRESHOLDS)).toBe(false);
	});

	/**
	 * A handful of events is not a pattern, and the cost of being wrong here is a banner accusing
	 * someone of faking their timesheet.
	 */
	it('says nothing on too little evidence', () => {
		expect(looksSynthetic(syntheticStream(5), THRESHOLDS)).toBe(false);
	});

	it('judges only the most recent window, so an old hand stops vouching for a jiggler', () => {
		const stream = [...humanStream(30), ...syntheticStream(60)];

		expect(looksSynthetic(stream, THRESHOLDS)).toBe(true);
	});

	/** Every event at the same instant is a burst, not a rhythm - and the mean is zero. */
	it('does not read a burst of simultaneous events as a rhythm', () => {
		const burst = Array.from({ length: 60 }, () => ({ at: 0, x: 500, y: 400, isPointer: true }));

		expect(looksSynthetic(burst, THRESHOLDS)).toBe(false);
	});

	it('finds nothing in an empty stream', () => {
		expect(looksSynthetic([], THRESHOLDS)).toBe(false);
	});
});

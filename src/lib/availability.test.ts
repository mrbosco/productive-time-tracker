import { describe, expect, it } from 'vitest';
import { expectedMinutesOn, parseAvailabilities } from './availability';

/** The recorded shape, verbatim from `docs/api/samples/person-show.json`. */
const RECORDED = '[["2026-09-15", null, [8, 8, 8, 8, 8, 0, 0, 8, 8, 8, 8, 8, 0, 0], 65416]]';

describe('availability', () => {
	it('reads the recorded shape, Monday first', () => {
		const periods = parseAvailabilities(RECORDED);

		// Tue 15 and Fri 18 are working days; Sat 19 and Sun 20 are not. Mon 14 is before the
		// period begins, which is the "nothing said" case below rather than a day off.
		expect(expectedMinutesOn(periods, '2026-09-15')).toBe(480);
		expect(expectedMinutesOn(periods, '2026-09-18')).toBe(480);
		expect(expectedMinutesOn(periods, '2026-09-19')).toBe(0);
		expect(expectedMinutesOn(periods, '2026-09-20')).toBe(0);
	});

	/** A four-day week is the case a weekend test cannot see. */
	it('answers zero for any non-working day, not only a weekend', () => {
		const periods = parseAvailabilities('[["2026-09-14", null, [8, 8, 8, 8, 0, 0, 0], 1]]');

		expect(expectedMinutesOn(periods, '2026-09-18')).toBe(0);
	});

	it('takes the second week of a fortnight on alternate weeks', () => {
		const periods = parseAvailabilities('[["2026-09-14", null, [8, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0], 1]]');

		expect(expectedMinutesOn(periods, '2026-09-14')).toBe(480);
		expect(expectedMinutesOn(periods, '2026-09-21')).toBe(0);
		expect(expectedMinutesOn(periods, '2026-09-22')).toBe(480);
	});

	/** Nothing said is not the same as zero expected, and UI-6 hides its numbers on null. */
	it('says nothing for a date outside every period, and for anything unparseable', () => {
		expect(expectedMinutesOn(parseAvailabilities(RECORDED), '2026-09-14')).toBeNull();
		expect(parseAvailabilities(null)).toEqual([]);
		expect(parseAvailabilities('not json')).toEqual([]);
		expect(parseAvailabilities('[["2026-09-15"]]')).toEqual([]);
	});
});

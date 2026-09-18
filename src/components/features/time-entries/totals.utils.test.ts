import { describe, expect, it } from 'vitest';
import { lastLoggedDayBefore } from './totals.utils';

/** The week of Monday 14 September 2026 through Sunday the 20th. */
const FRIDAY = '2026-09-18';
const SATURDAY = '2026-09-19';
const SUNDAY = '2026-09-20';

describe('lastLoggedDayBefore', () => {
	it('picks the nearest earlier day that has time on it', () => {
		expect(lastLoggedDayBefore(SUNDAY, { '2026-09-15': 60, [FRIDAY]: 480 })).toBe(FRIDAY);
	});

	/** The reason this exists: Saturday is empty, so a Sunday offered to copy it would copy nothing. */
	it('reaches past days with nothing on them', () => {
		expect(lastLoggedDayBefore(SUNDAY, { [FRIDAY]: 480, [SATURDAY]: 0 })).toBe(FRIDAY);
	});

	it('ignores the day itself and the ones after it', () => {
		expect(lastLoggedDayBefore(SATURDAY, { [SATURDAY]: 120, [SUNDAY]: 120 })).toBe(FRIDAY);
	});

	/** Nothing earlier in the week, or no week loaded yet: the offer is the day before, as it was. */
	it('falls back to the day before', () => {
		expect(lastLoggedDayBefore(SATURDAY, {})).toBe(FRIDAY);
		expect(lastLoggedDayBefore(SATURDAY, undefined)).toBe(FRIDAY);
		expect(lastLoggedDayBefore('2026-09-14', { '2026-09-15': 60 })).toBe('2026-09-13');
	});
});

import { describe, expect, it } from 'vitest';
import { formatDuration, parseDuration, toMinutesOfDay } from './duration';

describe('formatDuration', () => {
	it.each([
		[0, '0h'],
		[1, '1m'],
		[45, '45m'],
		[59, '59m'],
		[60, '1h'],
		[90, '1h 30m'],
		[105, '1h 45m'],
		[240, '4h'],
		[540, '9h'],
		[1440, '24h'],
	])('renders %i minutes as %s', (minutes, expected) => {
		expect(formatDuration(minutes)).toBe(expected);
	});

	/** A zero-minute entry is real data, not a placeholder - Productive writes them (A-8). */
	it('renders a zero-minute entry rather than an empty string', () => {
		expect(formatDuration(0)).toBe('0h');
	});

	it('never renders a colon or a decimal', () => {
		expect(formatDuration(90)).not.toContain(':');
		expect(formatDuration(90)).not.toContain('.');
	});

	it.each([-30, Number.NaN, Number.POSITIVE_INFINITY])('falls back to 0h for %s', (minutes) => {
		expect(formatDuration(minutes)).toBe('0h');
	});

	it('truncates a fractional minute rather than showing it', () => {
		expect(formatDuration(90.7)).toBe('1h 30m');
	});
});

describe('parseDuration', () => {
	it.each([
		// The four forms the helper caption promises.
		['1h 30m', 90],
		['1:30', 90],
		['1.5h', 90],
		['90', 90],
		// Spacing and the optional trailing unit.
		['1h30m', 90],
		['1h30', 90],
		['1h 30', 90],
		['  1h 30m  ', 90],
		// Hours alone, minutes alone.
		['2h', 120],
		['45m', 45],
		['90min', 90],
		['0:45', 45],
		// A comma is a decimal point where the user's keyboard says it is.
		['1,5h', 90],
		['1,5', 2],
		// Case is not meaningful.
		['1H 30M', 90],
		// Over the form's 24h rule, but still a duration: the schema rejects it, not the parser.
		['25h', 1500],
		['1440', 1440],
		// Zero parses; A-8 rejects it in the schema, for a different reason and a different message.
		['0', 0],
		['0h', 0],
	])('reads %s as %i minutes', (input, expected) => {
		expect(parseDuration(input)).toBe(expected);
	});

	it.each(['', '   ', 'half a day', 'abc', '1h30m45s', '1:', ':30', '1:2:3', '-30', '1.5.2h', 'h', 'm'])(
		'returns null for %s, which is not a duration',
		(input) => {
			expect(parseDuration(input)).toBeNull();
		}
	);

	/**
	 * The form shows `= 1h 30m` beside the field, so the two functions are read together on every
	 * keystroke. Anything `formatDuration` prints has to survive being typed back in.
	 */
	it.each([1, 45, 60, 90, 105, 240, 540, 1440])('round-trips %i through the rendered form', (minutes) => {
		expect(parseDuration(formatDuration(minutes))).toBe(minutes);
	});

	/** `1:75` is the same arithmetic as `1h 75m`; neither is rejected for the minutes exceeding 59. */
	it('carries minutes past 59 rather than rejecting them', () => {
		expect(parseDuration('1:75')).toBe(135);
	});

	/** Empty and unreadable are both null on purpose - the form distinguishes them by the input. */
	it('does not distinguish empty from unreadable', () => {
		expect(parseDuration('')).toBe(parseDuration('half a day'));
	});
});

describe('toMinutesOfDay', () => {
	it.each([
		['00:00', 0],
		['09:00', 540],
		['09:30', 570],
		['23:59', 1439],
		['9:05', 545],
	])('reads %s as %i minutes past midnight', (value, expected) => {
		expect(toMinutesOfDay(value)).toBe(expected);
	});

	/** Anything an `<input type="time">` would not produce, the empty value first. */
	it.each(['', '  ', '9', '9am', '09.30', '09:5', '24:00', '09:60', '1h 30m'])('reads %s as nothing', (value) => {
		expect(toMinutesOfDay(value)).toBeNull();
	});

	/**
	 * Why P-2 got a second function rather than another pattern inside the first: the two read the
	 * same shape differently. `1:75` is an hour and seventy-five minutes of work, which is a real
	 * duration; it is not a time of day, and a clock that accepted it would be inventing one.
	 */
	it('reads a clock where parseDuration reads a length', () => {
		expect(parseDuration('1:75')).toBe(135);
		expect(toMinutesOfDay('1:75')).toBeNull();

		expect(parseDuration('25:00')).toBe(1500);
		expect(toMinutesOfDay('25:00')).toBeNull();
	});
});

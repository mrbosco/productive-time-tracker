import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration';

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

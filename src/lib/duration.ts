/** Minutes into `1h 30m`, `45m` or `0h`. Clamped, so a stray negative renders `0h`. */
export function formatDuration(minutes: number): string {
	const total = Number.isFinite(minutes) ? Math.max(0, Math.trunc(minutes)) : 0;
	const hours = Math.floor(total / 60);
	const remainder = total % 60;

	if (hours === 0) return remainder === 0 ? '0h' : `${String(remainder)}m`;
	if (remainder === 0) return `${String(hours)}h`;

	return `${String(hours)}h ${String(remainder)}m`;
}

/** `1h 30m`, `1:30`, `1.5h` or `90` back into minutes; `null` for anything unreadable. The pattern
 * order is load-bearing: `1h30` has to be read as hours and minutes before the bare-number rule
 * gets at it, and `1:30` before anything else. */
export function parseDuration(input: string): number | null {
	const value = input.trim().toLowerCase();
	if (value === '') return null;

	// `1:30`. Minutes are taken as written: `1:75` is 135, the same arithmetic as `1h 75m`.
	const clock = /^(\d+):(\d{1,2})$/.exec(value);
	if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

	// A comma is a decimal point: half of Europe types it that way.
	const hoursAndMinutes = /^(\d+(?:[.,]\d+)?)\s*h\s*(\d+)\s*(?:min|m)?$/.exec(value);
	if (hoursAndMinutes) {
		return Math.round(Number(hoursAndMinutes[1].replace(',', '.')) * 60) + Number(hoursAndMinutes[2]);
	}

	const hours = /^(\d+(?:[.,]\d+)?)\s*h$/.exec(value);
	if (hours) return Math.round(Number(hours[1].replace(',', '.')) * 60);

	const minutes = /^(\d+)\s*m(in)?$/.exec(value);
	if (minutes) return Number(minutes[1]);

	const bare = /^\d+(?:[.,]\d+)?$/.exec(value);
	if (bare) return Math.round(Number(value.replace(',', '.')));

	return null;
}

/** `09:30` into minutes since midnight. Separate from `parseDuration` because `1:30` means "one
 * hour thirty" there and "half past one" here. No wrapping. */
export function toMinutesOfDay(value: string): number | null {
	const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
	if (match === null) return null;

	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (hours > 23 || minutes > 59) return null;

	return hours * 60 + minutes;
}

/** A running timer's elapsed time: `23s`, `9m 20s`, `1h 9m 20s`. Units rather than a clock, because
 * `9:20` reads as nine minutes here and nine hours three lines away on the same screen. */
export function formatElapsed(seconds: number): string {
	const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const remainder = total % 60;
	// Padded so the pill does not jitter a character wider every ten ticks.
	const padded = String(remainder).padStart(2, '0');

	if (hours === 0 && minutes === 0) return `${String(remainder)}s`;
	if (hours === 0) return `${String(minutes)}m ${padded}s`;

	return `${String(hours)}h ${String(minutes)}m ${padded}s`;
}

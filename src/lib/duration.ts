/**
 * Durations are minutes on the wire (`time`) and `1h 30m` on screen. The design brief fixes the
 * display form: `1h 30m`, `45m`, `0h` - never `00:00`, never decimals.
 *
 * Both directions live here: `formatDuration` for the screen, `parseDuration` for what the entry
 * form accepts back (A-2).
 */
export function formatDuration(minutes: number): string {
	// Negative or fractional minutes are not something the API returns, but a formatter that
	// renders `-1h -30m` for one would be worse than a formatter that renders `0h`.
	const total = Number.isFinite(minutes) ? Math.max(0, Math.trunc(minutes)) : 0;
	const hours = Math.floor(total / 60);
	const remainder = total % 60;

	// A zero-minute entry is a real record, not a placeholder: Productive writes them, and a
	// running timer is one until it stops (A-8). `0h` is the designed rendering.
	if (hours === 0) return remainder === 0 ? '0h' : `${String(remainder)}m`;
	if (remainder === 0) return `${String(hours)}h`;

	return `${String(hours)}h ${String(remainder)}m`;
}

/**
 * `1h 30m`, `1:30`, `1.5h` or `90` back into minutes (A-2). `null` for anything this cannot read,
 * empty input included - the caller tells those apart by looking at the input, because a sentinel
 * that is both "unreadable" and a `number` is exactly the kind of value TypeScript stops helping
 * with. `TimeEntryForm.utils.ts` maps the two cases onto two different messages.
 *
 * The patterns are ordered, and the order is load-bearing: `1h30` has to be read as hours and
 * minutes before the bare-number rule gets a chance at it, and `1:30` before anything else because
 * nothing later would match it at all.
 *
 * Bounds are deliberately not checked here. `> 0` and `<= 24h` are the form's rules (A-8), and a
 * parser that returned `null` for `25h` would collapse "that is not a duration" into "that is too
 * long" - two different things to be told.
 */
export function parseDuration(input: string): number | null {
	const value = input.trim().toLowerCase();
	if (value === '') return null;

	// `1:30`. Minutes are taken as written: `1:75` is 135, the same arithmetic as `1h 75m`.
	const clock = /^(\d+):(\d{1,2})$/.exec(value);
	if (clock) return Number(clock[1]) * 60 + Number(clock[2]);

	// `1h 30m`, `1h30`, `1.5h 6m`. A comma is a decimal point: half of Europe types it that way.
	const hoursAndMinutes = /^(\d+(?:[.,]\d+)?)\s*h\s*(\d+)\s*(?:min|m)?$/.exec(value);
	if (hoursAndMinutes) {
		return Math.round(Number(hoursAndMinutes[1].replace(',', '.')) * 60) + Number(hoursAndMinutes[2]);
	}

	const hours = /^(\d+(?:[.,]\d+)?)\s*h$/.exec(value);
	if (hours) return Math.round(Number(hours[1].replace(',', '.')) * 60);

	const minutes = /^(\d+)\s*m(in)?$/.exec(value);
	if (minutes) return Number(minutes[1]);

	// A bare number is minutes, which is what the API stores and what the helper text promises.
	const bare = /^\d+(?:[.,]\d+)?$/.exec(value);
	if (bare) return Math.round(Number(value.replace(',', '.')));

	return null;
}

/**
 * Durations are minutes on the wire (`time`) and `1h 30m` on screen. The design brief fixes the
 * display form: `1h 30m`, `45m`, `0h` - never `00:00`, never decimals.
 *
 * Only formatting lives here for now; US-2 adds the parser that turns `1:30` / `1.5h` / `90` back
 * into minutes.
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

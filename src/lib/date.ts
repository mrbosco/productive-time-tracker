import { z } from 'zod';

/**
 * Calendar dates, never instants (A-6).
 *
 * The trap this module exists to close: `new Date('2026-09-15')` is parsed as **UTC midnight**, so
 * anywhere west of Greenwich it reads back as the 14th. Every function here builds a `Date` from
 * local parts and reads it back from local parts, and `toISOString` is never used.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padded(value: number, length = 2): string {
	return String(value).padStart(length, '0');
}

/** `YYYY-MM-DD` in the browser's own time zone. */
export function toIsoDate(date: Date): string {
	return `${padded(date.getFullYear(), 4)}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;
}

/** Local midnight on that calendar day. Out-of-range parts roll over, which `isoDateSchema` rejects. */
export function parseIsoDate(iso: string): Date {
	const [year, month, day] = iso.split('-').map(Number);

	return new Date(year, month - 1, day);
}

export function todayIso(): string {
	return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
	const date = parseIsoDate(iso);
	// `setDate` handles month and year boundaries, and stays in local time.
	date.setDate(date.getDate() + days);

	return toIsoDate(date);
}

/**
 * The route boundary's guard (ADR-0007). Shape alone is not enough: `2026-13-45` matches the
 * pattern and `parseIsoDate` would happily roll it into 2027. Round-tripping is the cheap way to
 * reject a date that does not exist.
 */
export const isoDateSchema = z
	.string()
	.regex(ISO_DATE_PATTERN)
	.refine((iso) => toIsoDate(parseIsoDate(iso)) === iso, { message: 'Not a calendar date' });

export function isIsoDate(value: string): boolean {
	return isoDateSchema.safeParse(value).success;
}

/**
 * Fixed to `en-US` and assembled from parts rather than formatted whole. The app is English-only
 * (SPEC 9), and every off-the-shelf English locale gets one half of the design wrong: `en-US`
 * orders it month-first, and `en-GB` renders September as "Sept". Taking the parts and joining
 * them keeps `Tue 15 Sep` exactly as designed, and keeps the output identical in CI whatever the
 * runner's locale is.
 */
const DAY_PARTS = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
const DAY_PARTS_WITH_YEAR = new Intl.DateTimeFormat('en-US', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	year: 'numeric',
});

function joinParts(formatter: Intl.DateTimeFormat, date: Date, types: Intl.DateTimeFormatPartTypes[]): string {
	const parts = formatter.formatToParts(date);

	return types.map((type) => parts.find((part) => part.type === type)?.value ?? '').join(' ');
}

/** `Tue 15 Sep`, the form used inside the day label and by the date picker's trigger. */
export function formatDayShort(iso: string): string {
	return joinParts(DAY_PARTS, parseIsoDate(iso), ['weekday', 'day', 'month']);
}

/** `Tue 15 Sep 2026`, for a date far enough away that the year matters. */
export function formatDayWithYear(iso: string): string {
	return joinParts(DAY_PARTS_WITH_YEAR, parseIsoDate(iso), ['weekday', 'day', 'month', 'year']);
}

/**
 * The day navigator's label (A-3): `Today, Tue 15 Sep`, `Yesterday, Mon 14 Sep`, otherwise
 * `Wed 10 Sep 2026`. `today` is a parameter so the relative wording is testable without faking
 * the clock (guidebook 13).
 */
export function formatDayLabel(iso: string, today: string = todayIso()): string {
	if (iso === today) return `Today, ${formatDayShort(iso)}`;
	if (iso === addDays(today, -1)) return `Yesterday, ${formatDayShort(iso)}`;

	return formatDayWithYear(iso);
}

/**
 * The Monday of the week `iso` falls in. Monday because that is how the week strip is drawn
 * (`Day View.dc.html`) and how `Intl` orders the calendar for this app's locale.
 */
export function startOfWeek(iso: string): string {
	const date = parseIsoDate(iso);
	// `getDay` is 0 for Sunday, so Sunday is six days after its Monday rather than one before.
	const daysSinceMonday = (date.getDay() + 6) % 7;

	return addDays(iso, -daysSinceMonday);
}

/** Monday to Sunday of the week `iso` falls in, as ISO dates. */
export function weekDays(iso: string): string[] {
	const monday = startOfWeek(iso);

	return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function isWeekend(iso: string): boolean {
	const day = parseIsoDate(iso).getDay();

	return day === 0 || day === 6;
}

/** `Mon 14`, the week strip's desktop cell label. */
const WEEKDAY_AND_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' });

export function formatWeekdayAndDay(iso: string): string {
	return joinParts(WEEKDAY_AND_DAY, parseIsoDate(iso), ['weekday', 'day']);
}

/** `M`, the week strip's mobile cell label. Repeats across the week, as the design draws it. */
const WEEKDAY_INITIAL = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' });

export function formatWeekdayInitial(iso: string): string {
	return WEEKDAY_INITIAL.format(parseIsoDate(iso));
}

/** The day number alone, for the mobile cell. */
export function dayOfMonth(iso: string): number {
	return parseIsoDate(iso).getDate();
}

/**
 * The clock time of an instant, `HH:mm`, in whatever zone the browser is in (UI-9).
 *
 * The only place this app reads a timestamp as a time of day rather than as a calendar date - a
 * timer run started and stopped at a moment, which is exactly what A-6 says an entry's `date` is
 * not.
 */
const TIME_OF_DAY = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatTimeOfDay(instant: string): string {
	const parsed = new Date(instant);

	return Number.isNaN(parsed.getTime()) ? '' : TIME_OF_DAY.format(parsed);
}

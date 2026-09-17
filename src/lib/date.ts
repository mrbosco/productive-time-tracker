import { z } from 'zod';

/**
 * Calendar dates, never instants.
 *
 * The trap this module closes: `new Date('2026-09-15')` parses as **UTC midnight**, so anywhere
 * west of Greenwich it reads back as the 14th. Every function here builds a `Date` from local parts
 * and reads it back from local parts; `toISOString` is never used.
 */

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function padded(value: number, length = 2): string {
	return String(value).padStart(length, '0');
}

export function toIsoDate(date: Date): string {
	return `${padded(date.getFullYear(), 4)}-${padded(date.getMonth() + 1)}-${padded(date.getDate())}`;
}

/** Local midnight. Out-of-range parts roll over, which `isoDateSchema` rejects. */
export function parseIsoDate(iso: string): Date {
	const [year, month, day] = iso.split('-').map(Number);

	return new Date(year, month - 1, day);
}

export function todayIso(): string {
	return toIsoDate(new Date());
}

export function addDays(iso: string, days: number): string {
	const date = parseIsoDate(iso);
	date.setDate(date.getDate() + days);

	return toIsoDate(date);
}

/** Round-tripped, because `2026-13-45` matches the pattern and `parseIsoDate` rolls it into 2027. */
export const isoDateSchema = z
	.string()
	.regex(ISO_DATE_PATTERN)
	.refine((iso) => toIsoDate(parseIsoDate(iso)) === iso, { message: 'Not a calendar date' });

export function isIsoDate(value: string): boolean {
	return isoDateSchema.safeParse(value).success;
}

// Assembled from parts, not formatted whole: `en-US` orders it month-first and `en-GB` renders
// September as "Sept". A fixed locale also keeps CI output independent of the runner's.
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

/** `Tue 15 Sep`. */
export function formatDayShort(iso: string): string {
	return joinParts(DAY_PARTS, parseIsoDate(iso), ['weekday', 'day', 'month']);
}

/** `Tue 15 Sep 2026`. */
export function formatDayWithYear(iso: string): string {
	return joinParts(DAY_PARTS_WITH_YEAR, parseIsoDate(iso), ['weekday', 'day', 'month', 'year']);
}

/** `today` is a parameter so the relative wording is testable without faking the clock. */
export function formatDayLabel(iso: string, today: string = todayIso()): string {
	if (iso === today) return `Today, ${formatDayShort(iso)}`;
	if (iso === addDays(today, -1)) return `Yesterday, ${formatDayShort(iso)}`;

	return formatDayWithYear(iso);
}

export function startOfWeek(iso: string): string {
	const date = parseIsoDate(iso);
	// `getDay` is 0 for Sunday, so Sunday is six days after its Monday, not one before.
	const daysSinceMonday = (date.getDay() + 6) % 7;

	return addDays(iso, -daysSinceMonday);
}

export function weekDays(iso: string): string[] {
	const monday = startOfWeek(iso);

	return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

export function isWeekend(iso: string): boolean {
	const day = parseIsoDate(iso).getDay();

	return day === 0 || day === 6;
}

const WEEKDAY_AND_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' });

export function formatWeekdayAndDay(iso: string): string {
	return joinParts(WEEKDAY_AND_DAY, parseIsoDate(iso), ['weekday', 'day']);
}

const WEEKDAY_INITIAL = new Intl.DateTimeFormat('en-US', { weekday: 'narrow' });

export function formatWeekdayInitial(iso: string): string {
	return WEEKDAY_INITIAL.format(parseIsoDate(iso));
}

export function dayOfMonth(iso: string): number {
	return parseIsoDate(iso).getDate();
}

/** The only place this app reads a timestamp as a time of day rather than a calendar date. */
const TIME_OF_DAY = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

export function formatTimeOfDay(instant: string): string {
	const parsed = new Date(instant);

	return Number.isNaN(parsed.getTime()) ? '' : TIME_OF_DAY.format(parsed);
}

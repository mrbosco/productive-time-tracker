import type { TimeEntry } from '@/api/types';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { addDays, weekDays } from '@/lib/date';

/** Minutes logged across a day. Lives beside the component rather than inside it because the week
 * totals sum the same way over seven of these, and two components read it. */
export function calculateDayTotal(entries: TimeEntry[]): number {
	return entries.reduce((total, entry) => total + entry.minutes, 0);
}

/**
 * The day a copy should offer: the most recent one before `date` with time on it. An empty Saturday
 * offering an empty Friday is an offer to copy nothing, and the day worth copying is usually further
 * back than one.
 *
 * Only the week on screen is searched, and it costs nothing - the strip has already loaded it. When
 * it holds nothing earlier the day before stands in, which is the offer as it was.
 * ponytail: walking into the previous week means a request per week walked; add it if an empty
 * Monday, where the day before is in the week before, proves worth one.
 */
export function lastLoggedDayBefore(date: string, weekTotals: WeekTotals | undefined): string {
	const logged = weekDays(date).filter((day) => day < date && (weekTotals?.[day] ?? 0) > 0);

	return logged.at(-1) ?? addDays(date, -1);
}

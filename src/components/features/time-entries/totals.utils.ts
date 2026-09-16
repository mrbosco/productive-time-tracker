import type { TimeEntry } from '@/api/types';

/**
 * Minutes logged across a day. Lives beside the component rather than inside it (guidebook 3)
 * because X-1's week totals sum the same way over seven of these, and two components read it.
 */
export function calculateDayTotal(entries: TimeEntry[]): number {
	return entries.reduce((total, entry) => total + entry.minutes, 0);
}

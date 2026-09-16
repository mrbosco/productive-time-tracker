import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteTimeEntry } from '@/api/time-entries';
import type { TimeEntry } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import type { WeekTotals } from '@/components/features/week/useWeekTotals';
import { startOfWeek } from '@/lib/date';
import type { Session } from '@/lib/storage';

interface DeleteTimeEntryInput {
	id: string;
	/** The day it is leaving: which list it is removed from, and which keys are invalidated. */
	date: string;
	/** Subtracted from the week total, so the strip and the summary agree in the same frame. */
	minutes: number;
}

interface DeleteContext {
	entries: TimeEntry[] | undefined;
	weekTotals: WeekTotals | undefined;
}

/**
 * Deleting a time entry (R-12).
 *
 * The one optimistic write in the app, which is what SPEC 4.2 asks for and only here. Its two
 * siblings each explain why they are not: a POST or PATCH response carries only the `organization`
 * relationship (api-client rule 15), so an optimistic row could not render the service name every
 * card shows. A delete has nothing to render - the row goes - so there is no half-built entry to
 * flicker through, and the wait between the confirm and the 204 is dead time the user is watching.
 *
 * Both keys are moved, not just the list. The week strip cell for this day sits directly above the
 * summary the list drives, so removing the row while leaving the total alone prints two different
 * day totals a centimetre apart.
 */
export function useDeleteTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id }: DeleteTimeEntryInput) => deleteTimeEntry(toAuth(session), id),

		onMutate: async ({ id, date, minutes }): Promise<DeleteContext> => {
			const dayKey = ['time-entries', session.personId, date];
			const weekKey = ['week-totals', session.personId, startOfWeek(date)];

			// A refetch already in flight would land after this and put the row back, so it is
			// cancelled before the cache is written rather than after.
			await Promise.all([
				queryClient.cancelQueries({ queryKey: dayKey }),
				queryClient.cancelQueries({ queryKey: weekKey }),
			]);

			const entries = queryClient.getQueryData<TimeEntry[]>(dayKey);
			const weekTotals = queryClient.getQueryData<WeekTotals>(weekKey);

			if (entries !== undefined) {
				queryClient.setQueryData<TimeEntry[]>(
					dayKey,
					entries.filter((entry) => entry.id !== id)
				);
			}

			if (weekTotals !== undefined) {
				queryClient.setQueryData<WeekTotals>(weekKey, {
					...weekTotals,
					[date]: (weekTotals[date] ?? 0) - minutes,
				});
			}

			return { entries, weekTotals };
		},

		onError: (_error, { date }, context) => {
			// SPEC 4.2: "on failure the entry is restored". Put back exactly what was there,
			// including `undefined` for a key nothing had loaded - writing an empty array instead
			// would turn "not fetched" into "this day is empty".
			if (context === undefined) return;

			queryClient.setQueryData(['time-entries', session.personId, date], context.entries);
			queryClient.setQueryData(['week-totals', session.personId, startOfWeek(date)], context.weekTotals);
		},

		onSettled: (_data, _error, { id, date }) => {
			/*
			 * Removed, not invalidated, for the reason `useUpdateTimeEntry` gives: nothing
			 * subscribes to this key, because the edit route reads its entry through
			 * `ensureQueryData` - so an invalidated one would sit in the cache stale and be handed
			 * straight back, opening a form on an entry that no longer exists.
			 */
			queryClient.removeQueries({ queryKey: ['time-entry', id] });

			// After either outcome: the day is refetched whether the delete landed (to confirm it)
			// or failed (because the restored snapshot is now of unknown age).
			return Promise.all([
				queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, date] }),
				queryClient.invalidateQueries({ queryKey: ['week-totals', session.personId, startOfWeek(date)] }),
			]);
		},
	});
}

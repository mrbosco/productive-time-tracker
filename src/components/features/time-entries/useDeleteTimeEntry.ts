import { useMutation, useQueryClient } from '@tanstack/react-query';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { deleteTimeEntry } from '@/api/time-entries';
import type { TimeEntry } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';

import type { Session } from '@/lib/storage';

interface DeleteTimeEntryInput {
	id: string;
	date: string;
	minutes: number;
}

interface DeleteContext {
	weekEntries: TimeEntry[] | undefined;
}

/** Deleting a time entry, and the app's one optimistic write: a delete has nothing to render, where
 * a create or edit could not render the service name from a response carrying only `organization`.
 * Both keys move, or the week strip would print a total the summary below it disagrees with. */
export function useDeleteTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id }: DeleteTimeEntryInput) => deleteTimeEntry(toAuth(session), id),

		onMutate: async ({ id, date }): Promise<DeleteContext> => {
			const weekKey = weekQueryKey(session, date);

			// A refetch already in flight would land after this and put the row back, so it is
			// cancelled before the cache is written rather than after.
			await queryClient.cancelQueries({ queryKey: weekKey });

			const weekEntries = queryClient.getQueryData<TimeEntry[]>(weekKey);

			/* One key carries the day list, the week strip and the totals, so dropping the row here
			 * moves all three at once - the arithmetic happens in the `select`s over this array
			 * rather than in several places that could disagree. */
			if (weekEntries !== undefined) {
				queryClient.setQueryData<TimeEntry[]>(
					weekKey,
					weekEntries.filter((entry) => entry.id !== id)
				);
			}

			return { weekEntries };
		},

		onError: (_error, { date }, context) => {
			// On failure the entry is restored to exactly what was there. A key nothing had loaded
			// needs no undoing and gets none: `onMutate` skipped it, and
			// `setQueryData` ignores an `undefined` value rather than writing one, so the two
			// agree without a guard here.
			if (context === undefined) return;

			queryClient.setQueryData(weekQueryKey(session, date), context.weekEntries);
		},

		onSettled: (_data, _error, { id, date }) => {
			/* Removed, not invalidated, for the reason `useUpdateTimeEntry` gives: nothing
			 * subscribes to this key, because the edit route reads its entry through
			 * `ensureQueryData` - so an invalidated one would sit in the cache stale and be handed
			 * straight back, opening a form on an entry that no longer exists. */
			queryClient.removeQueries({ queryKey: ['time-entry', id] });

			// After either outcome: refetched whether the delete landed (to confirm it) or failed
			// (because the restored snapshot is now of unknown age).
			return queryClient.invalidateQueries({ queryKey: weekQueryKey(session, date) });
		},
	});
}

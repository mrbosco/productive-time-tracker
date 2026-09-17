import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TimeEntry } from '@/api/types';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { updateTimeEntry } from '@/api/time-entries';
import type { TimeEntryInput } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek } from '@/lib/date';
import type { Session } from '@/lib/storage';

interface UpdateTimeEntryInput {
	id: string;
	previousDate: string;
	date: string;
	/** Only the attributes that actually changed. Separate from `date` above, which is needed for the
	 * cache keys whether or not it was edited: cache routing must not decide what goes on the wire. */
	changes: Partial<TimeEntryInput>;
}

/** Editing a time entry. The service is never sent, and an edit can move an entry to another day, so
 * both days and both weeks are invalidated. Only the duration is written optimistically (below): a
 * PATCH response carries just `organization`, so a row could not render the service name. */
export function useUpdateTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, changes }: UpdateTimeEntryInput) => updateTimeEntry(toAuth(session), id, changes),
		/** Optimistic on the duration alone. The inline field is a correction made where the number is
		 * written, so the number has to move with it - waiting for a PATCH and a refetch reads as the
		 * edit having been ignored. A date move rewrites which day an entry is on, which is more than
		 * a cache can honestly guess at. */
		onMutate: ({ id, date, previousDate, changes }) => {
			if (changes.minutes === undefined || date !== previousDate) return undefined;

			const keys = [[...weekQueryKey(session, date)]];
			const previous = keys.map((key) => [key, queryClient.getQueryData<TimeEntry[]>(key)] as const);

			for (const [key] of previous) {
				queryClient.setQueryData<TimeEntry[]>(key, (entries) =>
					entries?.map((entry) => (entry.id === id ? { ...entry, minutes: changes.minutes ?? entry.minutes } : entry))
				);
			}

			return { previous };
		},

		onError: (_error, _input, context) => {
			for (const [key, entries] of context?.previous ?? []) queryClient.setQueryData(key, entries);
		},

		onSuccess: (_entry, { id, previousDate, date }) => {
			/* Removed, not invalidated: nothing observes this key, because the edit route reads its
			 * entry from a loader, and `invalidateQueries` only refetches what something watches. An
			 * invalidated one would sit stale and `ensureQueryData` would hand it straight back, so
			 * reopening an entry just saved prefilled the values from before the save. */
			queryClient.removeQueries({ queryKey: ['time-entry', id] });

			// Both weeks, because an edit can move an entry across a week boundary. A Set, because
			// most edits do not and that is then one invalidation rather than two of the same key.
			const weeks = new Set([startOfWeek(previousDate), startOfWeek(date)]);

			// Awaited so the day list is already refetching when the route changes; it then renders
			// the edited entry rather than briefly showing the value that was just replaced.
			return Promise.all(
				[...weeks].map((monday) => queryClient.invalidateQueries({ queryKey: weekQueryKey(session, monday) }))
			);
		},
	});
}

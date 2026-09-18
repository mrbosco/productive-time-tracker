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
		onMutate: async ({ id, date, previousDate, changes }) => {
			const minutes = changes.minutes;
			if (minutes === undefined || date !== previousDate) return undefined;

			const weekKey = weekQueryKey(session, date);

			/* A refetch already in flight would land after this and put the old number back, which is
			 * the same reason `useDeleteTimeEntry` cancels before it writes. The `onSuccess` below
			 * invalidates the week anyway, so nothing is left waiting on the fetch dropped here. */
			await queryClient.cancelQueries({ queryKey: weekKey });

			const previousMinutes = queryClient.getQueryData<TimeEntry[]>(weekKey)?.find((entry) => entry.id === id)?.minutes;

			queryClient.setQueryData<TimeEntry[]>(weekKey, (entries) =>
				entries?.map((entry) => (entry.id === id ? { ...entry, minutes } : entry))
			);

			return { weekKey, previousMinutes };
		},

		/** One entry's minutes, not the week as it was. A snapshot of the whole array written back
		 * would also undo what another write had done to a different row while this PATCH was in
		 * flight - a row deleted in the meantime would reappear until the next refetch. */
		onError: (_error, { id }, context) => {
			if (context?.previousMinutes === undefined) return;

			const { weekKey, previousMinutes } = context;
			queryClient.setQueryData<TimeEntry[]>(weekKey, (entries) =>
				entries?.map((entry) => (entry.id === id ? { ...entry, minutes: previousMinutes } : entry))
			);
		},

		onSuccess: (_entry, { id, previousDate, date }) => {
			/* Removed, not invalidated: nothing observes this key, because the edit route reads its
			 * entry from a loader, and `invalidateQueries` only refetches what something watches. An
			 * invalidated one would sit in the cache fresh enough for the loader to hand straight
			 * back, so reopening an entry just saved prefilled the values from before the save. */
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

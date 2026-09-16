import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTimeEntry } from '@/api/time-entries';
import type { TimeEntryInput } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek } from '@/lib/date';
import type { Session } from '@/lib/storage';

interface UpdateTimeEntryInput {
	id: string;
	/** The date the entry had before this edit, so the day it left is invalidated too. */
	previousDate: string;
	/** The date it has after it, changed or not: the day it landed on is invalidated either way. */
	date: string;
	/**
	 * Only the attributes that actually changed (SPEC 4.1, "Only changed attributes"). Separate from
	 * `date` above because that one is needed for the cache keys whether or not it was edited, and
	 * routing information must not decide what goes on the wire.
	 */
	changes: Partial<TimeEntryInput>;
}

/**
 * Editing a time entry (R-11).
 *
 * The service is never sent. A-1 decided that edit keeps the entry's existing service, so the only
 * attributes that can reach the wire are date, time and note - and of those, only the ones the form
 * reports as actually edited (SPEC 4.1).
 *
 * Where the create hook invalidates two keys, this one invalidates up to five, because an edit can
 * move an entry to another day. SPEC 4.2 asks for "that date (and the old date if the date was
 * changed on edit)", and X-1's week strip means each date drags its Monday along: leaving the old
 * week alone would show the entry's minutes on two weeks at once. A `Set` collapses them back to
 * two keys when the date did not change, so the ordinary edit costs what it did before.
 *
 * Nothing is updated optimistically. SPEC 4.2 asks for that on delete only, and a PATCH response
 * carries just the `organization` relationship (api-client rule 15), so an optimistic row could not
 * render the service name every card shows.
 */
export function useUpdateTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, changes }: UpdateTimeEntryInput) => updateTimeEntry(toAuth(session), id, changes),
		onSuccess: (_entry, { id, previousDate, date }) => {
			/*
			 * Removed, not invalidated, and synchronously - nothing observes this key, because the
			 * edit route reads its entry from a loader rather than a subscription, and
			 * `invalidateQueries` only refetches queries something is watching. An invalidated one
			 * would sit in the cache stale and `ensureQueryData` would hand it straight back, so
			 * reopening an entry just saved prefilled the values from before the save - and saving
			 * that form put them back.
			 */
			queryClient.removeQueries({ queryKey: ['time-entry', id] });

			const days = new Set([previousDate, date]);
			const weeks = new Set([startOfWeek(previousDate), startOfWeek(date)]);

			// Awaited so the day list is already refetching when the route changes; it then renders
			// the edited entry rather than briefly showing the value that was just replaced.
			return Promise.all([
				...[...days].map((day) => queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, day] })),
				...[...weeks].map((monday) =>
					queryClient.invalidateQueries({ queryKey: ['week-totals', session.personId, monday] })
				),
			]);
		},
	});
}

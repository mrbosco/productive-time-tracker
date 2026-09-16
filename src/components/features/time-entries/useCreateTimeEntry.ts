import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTimeEntry } from '@/api/time-entries';
import type { TimeEntryInput } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';
import { startOfWeek } from '@/lib/date';
import type { Session } from '@/lib/storage';

/**
 * Creating a time entry for the logged-in person (R-9).
 *
 * `personId` comes from the session, never from a field - the assignment's "for the sake of
 * simplicity, set it dynamically" (R-10). `serviceId` comes from A-1's default, because the form
 * has three fields and the service is not one of them.
 *
 * Two keys are invalidated, not one. SPEC 4.2 only names the day, but X-1 shipped with US-1, so the
 * week strip and the desktop totals card are both rendered from `['week-totals', personId, monday]`
 * - invalidating only the day would leave the strip showing a total that no longer matches the list
 * directly beneath it.
 *
 * Nothing is inserted optimistically. A create response carries only the `organization`
 * relationship (api-client rule 15), so an optimistic row could not render the service name every
 * card shows, and would flicker from blank to correct on the refetch.
 */
export function useCreateTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: TimeEntryInput & { serviceId: string }) =>
			createTimeEntry(toAuth(session), { ...input, personId: session.personId }),
		onSuccess: (_entry, input) => {
			// Awaited so the day list is already refetching when the route changes; the list then
			// renders its data rather than briefly showing the day without the new entry.
			return Promise.all([
				queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, input.date] }),
				queryClient.invalidateQueries({
					queryKey: ['week-totals', session.personId, startOfWeek(input.date)],
				}),
			]);
		},
	});
}

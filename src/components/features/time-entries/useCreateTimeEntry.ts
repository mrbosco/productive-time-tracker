import { useMutation, useQueryClient } from '@tanstack/react-query';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { createTimeEntry } from '@/api/time-entries';
import type { TimeEntryInput } from '@/api/types';
import { toAuth } from '@/components/features/auth/useSession';

import type { Session } from '@/lib/storage';

/** Creating a time entry for the logged-in person. `personId` comes from the session and `serviceId`
 * from the chosen default. Two keys are invalidated, because the strip above the list reads the
 * week. Nothing is inserted optimistically: a create response carries only `organization`, so the
 * row could not render the service name. */
export function useCreateTimeEntry(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: TimeEntryInput & { serviceId: string }) =>
			createTimeEntry(toAuth(session), { ...input, personId: session.personId }),
		onSuccess: (_entry, input) => {
			// Awaited so the day list is already refetching when the route changes; the list then
			// renders its data rather than briefly showing the day without the new entry.
			return Promise.all([
				queryClient.invalidateQueries({
					queryKey: weekQueryKey(session, input.date),
				}),
			]);
		},
	});
}

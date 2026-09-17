import { useMutation, useQueryClient } from '@tanstack/react-query';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { createTimeEntry, listTimeEntries } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';

import type { Session } from '@/lib/storage';

export interface CopyDayResult {
	copied: number;
	failed: number;
}

/** Copies every entry of one day onto another. One mutation rather than a loop of
 * `useCreateTimeEntry` calls, which would refetch the list N times while still writing to it, and
 * sequential rather than parallel, because the day is sorted by `created_at`. A failed entry is
 * counted rather than thrown; only a failure to read the source day throws. */
export function useCopyDayForward(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ from, to }: { from: string; to: string }): Promise<CopyDayResult> => {
			/* Read directly rather than through the cache. A copy has to be of what is on the source
			 * day *now*, and the cached alternative is a whole week that may not even be the week on
			 * screen - the source day is often the Sunday of the week before. One request for one
			 * day, used once and not kept, is both cheaper and easier to reason about. */
			const source = await listTimeEntries(toAuth(session), session.personId, from);

			let copied = 0;
			let failed = 0;

			/* Oldest first, against the newest-first order the list is read in. Each copy is stamped
			 * with the moment it was posted, so posting oldest-first is what makes the new day read in
			 * the same order as the one it came from. */
			for (const entry of [...source].reverse()) {
				/* A copy keeps the service of the entry it came from rather than taking the default. An
				 * entry whose service was never included has nothing to copy and is counted as a failure
				 * rather than quietly rewritten. */
				if (entry.serviceId === null) {
					failed += 1;
					continue;
				}

				try {
					await createTimeEntry(toAuth(session), {
						date: to,
						minutes: entry.minutes,
						note: entry.note,
						personId: session.personId,
						serviceId: entry.serviceId,
					});
					copied += 1;
				} catch {
					failed += 1;
				}
			}

			return { copied, failed };
		},

		onSuccess: (result, { to }) => {
			if (result.copied === 0) return;

			// One key carries the list, the strip and the totals, so they cannot disagree about what
			// was just copied in.
			return queryClient.invalidateQueries({ queryKey: weekQueryKey(session, to) });
		},
	});
}

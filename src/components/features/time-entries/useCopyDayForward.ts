import { useMutation, useQueryClient } from '@tanstack/react-query';
import { weekQueryKey } from '@/components/features/week/useWeekEntries';
import { createTimeEntry } from '@/api/time-entries';
import { toAuth } from '@/components/features/auth/useSession';
import { timeEntriesQueryOptions } from '@/components/features/time-entries/useTimeEntries';

import type { Session } from '@/lib/storage';

/** What a copy did, which is what the toast reports (SPEC 10, X-3: "count and failures"). */
export interface CopyDayResult {
	copied: number;
	failed: number;
}

/**
 * Copies every entry of one day onto another (SPEC 10, X-3), from the empty state's
 * `Copy from yesterday`.
 *
 * One mutation rather than a loop of `useCreateTimeEntry` calls, and that is the whole reason this
 * file exists: the create hook invalidates the day and the week on every success, so N entries
 * would mean N refetches of the list this is still writing to. Here the POSTs are the mutation and
 * the invalidation happens once, after all of them.
 *
 * Sequential, not `Promise.all`. Productive assigns no order of its own - the day is sorted by
 * `created_at` client-side (A-7) - so entries posted in parallel would land in whatever order the
 * network returned them, and the copy would not read like the day it came from.
 *
 * A failure is counted rather than thrown. Three entries where one is refused is two entries
 * copied, and abandoning the other two because of it would leave the day half-written with nothing
 * saying which half. Only a failure to read the source day throws, because then nothing was
 * attempted at all.
 */
export function useCopyDayForward(session: Session) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ from, to }: { from: string; to: string }): Promise<CopyDayResult> => {
			// `fetchQuery` with `staleTime: 0`, not `ensureQueryData`: a copy should be of what is on
			// the source day now. Without the override this inherits the client's 30s staleness and
			// copies whatever was last read, which is the same default that kept the timer pill
			// from ever starting.
			const source = await queryClient.fetchQuery({ ...timeEntriesQueryOptions(session, from), staleTime: 0 });

			let copied = 0;
			let failed = 0;

			/*
			 * Oldest first, against the order the list is read in (A-7 is newest first now). Each
			 * copy is stamped with the moment it was posted, so posting oldest-first is what makes
			 * the new day read in the same order as the one it came from - posting in display order
			 * would land them reversed.
			 */
			for (const entry of [...source].reverse()) {
				/*
				 * A-1 chooses the service for a new entry, but a copy already has one: the entry it
				 * came from. An entry whose service was never included has nothing to copy onto and
				 * is counted as a failure rather than quietly rewritten to the default.
				 */
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

			// The day and its week, as every write here does - X-1's strip and the totals card both
			// read the week, and leaving it would show a total the list below it disagrees with.
			return Promise.all([
				queryClient.invalidateQueries({ queryKey: ['time-entries', session.personId, to] }),
				queryClient.invalidateQueries({ queryKey: weekQueryKey(session, to) }),
			]);
		},
	});
}

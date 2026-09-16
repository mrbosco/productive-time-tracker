import { QueryClient } from '@tanstack/react-query';

/**
 * One client per app instance, and a fresh one per test (see `src/__tests__/test-utils.tsx`).
 * Defaults are conservative: a time tracker's day view changes rarely within a session,
 * and a background refetch on every window focus would be noise, not freshness.
 */
export function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30_000,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});
}

import { QueryClient } from '@tanstack/react-query';

/** One client per app instance, a fresh one per test. Defaults are conservative: a day view changes
 * rarely within a session, and refetching on every window focus would be noise, not freshness. */
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

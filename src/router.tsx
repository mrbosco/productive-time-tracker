import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from '@/components/features/auth/useSession';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
	queryClient: QueryClient;
	auth: AuthContextValue;
}

/**
 * `auth` is filled in by `<RouterProvider context={{ auth }}>` in `App.tsx`, because it comes from
 * React state and the router is created once, outside React. The non-null assertion is the shape
 * TanStack documents for exactly this: the value is undefined only between `createRouter` and the
 * first render, and nothing runs in that window.
 */
export function createAppRouter(queryClient: QueryClient) {
	return createRouter({
		routeTree,
		defaultPreload: 'intent',
		scrollRestoration: true,
		context: { queryClient, auth: undefined as unknown as AuthContextValue },
	});
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof createAppRouter>;
	}

	/**
	 * History state, which travels with a navigation but never appears in the URL.
	 *
	 * `toast` is how a write tells the screen it returns to that it succeeded: the entry form
	 * navigates to the day and the day raises the confirmation. Keeping it out of the URL keeps it
	 * out of anything the user shares; the day view spends it once shown, because history state
	 * itself does survive a reload.
	 */
	interface HistoryState {
		toast?: string;
	}
}

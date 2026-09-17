import type { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { AuthContextValue } from '@/components/features/auth/useSession';
import { routeTree } from './routeTree.gen';

export interface RouterContext {
	queryClient: QueryClient;
	auth: AuthContextValue;
}

/** `auth` is filled in by `<RouterProvider context={{ auth }}>` in `App.tsx`, because it comes from
 * React state and the router is created once outside React. The non-null assertion is the shape
 * TanStack documents for it: undefined only between `createRouter` and the first render. */
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

	/** History state: travels with a navigation, never appears in the URL. `toast` is how a write
	 * tells the screen it returns to that it succeeded. */
	interface HistoryState {
		toast?: string;
	}
}

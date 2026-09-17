import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from '@tanstack/react-router';
import { render, type RenderOptions, renderHook, type RenderHookOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { SessionProvider } from '@/components/features/auth/useSession';
import { TimerProvider } from '@/components/features/timer/TimerProvider';
import { type Session, writeSession } from '@/lib/storage';

function createTestQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, staleTime: 0 },
			mutations: { retry: false },
		},
	});
}

/**
 * Every destination the app navigates to or links at, so a `<Link>` rendered by a component under
 * test resolves instead of falling into the not-found branch and losing the assertion. Add a path
 * here when a new route becomes a link target, rather than re-wiring providers in one test file
 * (testing.md rule 1).
 */
const TEST_ROUTE_PATHS = ['/', '/login', '/day/$date', '/entries/new', '/entries/$id/edit'];

/**
 * A throwaway router whose every route renders the component under test, so anything that
 * navigates or renders a `<Link>` works without the component knowing it is in a test. Asserting
 * on `router.state.location.pathname` is then how a test checks where a component sent the user.
 */
function createTestRouter(ui: ReactElement, initialEntry: string) {
	const rootRoute = createRootRoute();
	const routes = TEST_ROUTE_PATHS.map((path) =>
		createRoute({ getParentRoute: () => rootRoute, path, component: () => ui })
	);

	return createRouter({
		routeTree: rootRoute.addChildren(routes),
		history: createMemoryHistory({ initialEntries: [initialEntry] }),
	});
}

/** The session the fixtures describe: Ada Lovelace, person 1448639, organization 999999. */
export const testSession: Session = {
	token: 'test-token',
	organizationId: '999999',
	personId: '1448639',
	personName: 'Ada Lovelace',
};

interface Options extends Omit<RenderOptions, 'wrapper'> {
	/** Seeds `localStorage` before the provider reads it, as a real logged-in browser would be. */
	session?: Session;
	/**
	 * Where the throwaway router starts. Worth setting whenever a test asserts on where the
	 * component navigated: starting on the destination makes the assertion pass without it.
	 */
	initialEntry?: string;
}

/**
 * Renders with a throwaway QueryClient, session provider and router, so no state leaks between
 * tests.
 *
 * Async because a freshly created router is `pending` with no matches until `load()` resolves -
 * rendering before that paints an empty document, which surfaces as every query failing to find
 * anything.
 */
export async function renderWithProviders(ui: ReactElement, { session, initialEntry = '/', ...options }: Options = {}) {
	if (session !== undefined) writeSession(session);

	const queryClient = createTestQueryClient();
	const router = createTestRouter(ui, initialEntry);
	await router.load();

	/*
	 * `TimerProvider` only when there is a session, because it needs one - and because a screen
	 * rendered without one is a screen behind the auth boundary, where no timer exists. Extended
	 * here rather than wrapped per file (testing.md rule 1): the day view and the app bar both read
	 * the timer now, and X-5's banner will be the third.
	 */
	function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				<SessionProvider>
					{session === undefined ? children : <TimerProvider session={session}>{children}</TimerProvider>}
				</SessionProvider>
			</QueryClientProvider>
		);
	}

	// The router renders `ui` itself, so `render` is handed the provider tree only.
	return {
		queryClient,
		router,
		...render(<RouterProvider router={router} />, { wrapper: Wrapper, ...options }),
	};
}

/**
 * The hook equivalent, for hooks that need the query cache but no router or DOM of their own.
 * Kept here rather than rebuilt per file (testing.md rule 1).
 */
export function renderHookWithProviders<TResult, TProps>(
	hook: (props: TProps) => TResult,
	options?: Omit<RenderHookOptions<TProps>, 'wrapper'>
) {
	const queryClient = createTestQueryClient();

	function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	}

	return { queryClient, ...renderHook(hook, { wrapper: Wrapper, ...options }) };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

/**
 * Router context (session, queryClient) and `beforeLoad` guards land with the auth
 * feature (ADR-0007); the scaffold only wires the provider.
 */
export function createAppRouter() {
	return createRouter({
		routeTree,
		defaultPreload: 'intent',
		scrollRestoration: true,
	});
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof createAppRouter>;
	}
}

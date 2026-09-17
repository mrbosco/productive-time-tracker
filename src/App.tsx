import { RouterProvider } from '@tanstack/react-router';
import { useSession } from '@/components/features/auth/useSession';
import type { createAppRouter } from '@/router';

/** Feeds the session into the router context, so `beforeLoad` guards can redirect on it (ADR-0007).
 * `RouterProvider` applies `context` during render, which is why `login` and `logout` flush their
 * state update synchronously. */
export function App({ router }: { router: ReturnType<typeof createAppRouter> }) {
	const auth = useSession();

	return <RouterProvider router={router} context={{ auth }} />;
}

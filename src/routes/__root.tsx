import { createRootRoute, Outlet } from '@tanstack/react-router';
import { lazy, Suspense } from 'react';

// Dead-code-eliminated in production: `import.meta.env.DEV` is a literal at build time,
// so neither devtools package reaches the bundle.
const DevTools = import.meta.env.DEV
	? lazy(async () => {
			const [router, query] = await Promise.all([
				import('@tanstack/react-router-devtools'),
				import('@tanstack/react-query-devtools'),
			]);

			return {
				default: () => (
					<>
						<router.TanStackRouterDevtools position="bottom-right" />
						<query.ReactQueryDevtools initialIsOpen={false} />
					</>
				),
			};
		})
	: () => null;

export const Route = createRootRoute({
	component: RootLayout,
});

function RootLayout() {
	return (
		<>
			<Outlet />
			<Suspense>
				<DevTools />
			</Suspense>
		</>
	);
}

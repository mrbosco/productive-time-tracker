import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';
import type { RouterContext } from '@/router';

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

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});

/**
 * Moves focus to the new page's heading after every navigation (guidebook 18).
 *
 * A client-side route change leaves focus on whatever was clicked and leaves a screen reader
 * announcing nothing, so a keyboard or screen-reader user has no idea the page changed. Doing it
 * here, once, means no route has to remember: each page marks its `h1` with `tabIndex={-1}`, which
 * makes it programmatically focusable without adding it to the tab order.
 */
function useFocusHeadingOnNavigation() {
	const router = useRouter();

	useEffect(() => {
		// `onRendered`, not `onResolved`: the latter fires while the new matches are still being
		// committed, so the heading being focused can be the one leaving the screen.
		return router.subscribe('onRendered', () => {
			const heading = document.querySelector<HTMLElement>('h1[tabindex="-1"]');

			// Not while a modal is up. A route that renders a screen behind its dialog - the entry
			// form does, because the design keeps the day visible on desktop - still has that
			// screen's `h1` in the document, but Radix has marked the subtree `aria-hidden` and
			// focus belongs inside the dialog. Racing focus into hidden content would undo the
			// trap that guidebook 18 asks for.
			if (heading === null) return;
			if (heading.closest('[aria-hidden="true"]') !== null) return;

			heading.focus();
		});
	}, [router]);
}

function RootLayout() {
	useFocusHeadingOnNavigation();

	return (
		<>
			<Outlet />
			<Suspense>
				<DevTools />
			</Suspense>
		</>
	);
}

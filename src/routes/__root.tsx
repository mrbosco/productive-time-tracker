import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';
import { lazy, Suspense, useEffect } from 'react';
import type { RouterContext } from '@/router';

/* Dead-code-eliminated in production: `import.meta.env.DEV` is a literal at build time. Off under
 * automation as well - both panels park a floating button exactly where the day's `Add entry` FAB
 * is at 390px, and the devtools logo swallowed the click. */
const DevTools =
	import.meta.env.DEV && !navigator.webdriver
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

/** Moves focus to the new page's heading after every navigation: a client-side route change otherwise
 * leaves focus where it was and announces nothing. Done here once, so no route has to remember -
 * each page marks its `h1` with `tabIndex={-1}`. */
function useFocusHeadingOnNavigation() {
	const router = useRouter();

	useEffect(() => {
		// `onRendered`, not `onResolved`: the latter fires while the new matches are still being
		// committed, so the heading being focused can be the one leaving the screen.
		return router.subscribe('onRendered', () => {
			const heading = document.querySelector<HTMLElement>('h1[tabindex="-1"]');

			// Not while a modal is up. A route that renders a screen behind its dialog still has that
			// screen's `h1` in the document, but Radix has marked the subtree `aria-hidden` and focus
			// belongs inside the dialog - racing focus into hidden content would undo the trap.
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

import { useSyncExternalStore } from 'react';

/**
 * Whether the pointer on this device can hover.
 *
 * Which is not the same question as "is this screen narrow". A laptop at a small window still
 * hovers and a tablet at 1024px still does not, so the surfaces that answer a hover - UI-2's
 * service context, UI-6's expected hours - pick by input rather than by breakpoint.
 *
 * `matchMedia` is missing under jsdom, so a component test always takes the touch branch. That is
 * deliberate: the hover branch needs real pointer events and is covered in `e2e/` instead.
 */
const HOVER_QUERY = '(hover: hover)';

function subscribe(onChange: () => void): () => void {
	const query = window.matchMedia?.(HOVER_QUERY);
	if (query === undefined) return () => undefined;

	query.addEventListener('change', onChange);

	return () => {
		query.removeEventListener('change', onChange);
	};
}

function getSnapshot(): boolean {
	return window.matchMedia?.(HOVER_QUERY).matches ?? false;
}

export function useHasHover(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

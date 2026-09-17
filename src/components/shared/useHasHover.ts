import { useSyncExternalStore } from 'react';

/** Whether the pointer on this device can hover - not "is this screen narrow". A laptop at a small
 * window still hovers and a tablet at 1024px does not. `matchMedia` is missing under jsdom, so
 * component tests always take the touch branch and `e2e/` covers the other. */
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

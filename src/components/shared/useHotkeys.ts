import { useEffect } from 'react';

/** Where a keystroke belongs to whatever has focus rather than to the screen. `closest`, not a tag
 * check: the editor is a `contenteditable` whose events come from text nodes, and a dialog's fields
 * sit below the element carrying the role. Menus are listed because Radix handles their own arrows. */
const FOCUS_OWNS_KEYS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="menu"]';

export function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;

	return target.closest(FOCUS_OWNS_KEYS) !== null;
}

/** Keyed by `KeyboardEvent.key`: `n`, `?`, `ArrowLeft`, `Delete`. */
export type Hotkeys = Record<string, () => void>;

/** One `window` keydown listener for a map of single-key shortcuts. Modified keystrokes are never
 * claimed, with Shift the exception because `?` is typed with it. Anything matched is prevented,
 * or a shortcut would do two things at once. */
export function useHotkeys(hotkeys: Hotkeys, { enabled = true }: { enabled?: boolean } = {}): void {
	useEffect(() => {
		if (!enabled) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.ctrlKey || event.metaKey || event.altKey) return;
			if (isTypingTarget(event.target)) return;

			const handler = hotkeys[event.key];
			if (handler === undefined) return;

			event.preventDefault();
			handler();
		}

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
		/* Re-subscribes every render, which is the point: the handlers close over the caller's current
		 * state, and a map captured once would fire last render's `date` on every arrow key. */
	}, [hotkeys, enabled]);
}

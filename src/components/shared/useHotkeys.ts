import { useEffect } from 'react';

/**
 * Where a keystroke belongs to whatever has focus rather than to the screen (SPEC 10, X-2: "all
 * shortcuts are disabled while an input, textarea or dialog has focus" - Toggl's own rule).
 *
 * `closest`, not a tag check on the target itself: the rich-text editor is a `contenteditable` div
 * whose events come from the text nodes inside it, and a dialog's fields are several levels down
 * from the element carrying the role. Menus are here for the same reason arrows are - Radix gives
 * an open `DropdownMenu` its own arrow handling, and the day view must not move card focus
 * underneath it.
 */
const FOCUS_OWNS_KEYS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="menu"]';

export function isTypingTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;

	return target.closest(FOCUS_OWNS_KEYS) !== null;
}

/** Keyed by `KeyboardEvent.key`: `n`, `t`, `e`, `?`, `ArrowLeft`, `Delete`. */
export type Hotkeys = Record<string, () => void>;

/**
 * One `window` keydown listener for a map of single-key shortcuts (SPEC 10, X-2).
 *
 * A hook rather than a component because what it adds is behaviour, not markup, and `shared/` is
 * where it goes because both callers are in different trees: the app bar owns `?` on every route
 * and the day view owns the rest. `lib/` was the other candidate and is the wrong one - everything
 * there is pure, and this is a subscription.
 *
 * Modified keystrokes are never claimed: `Cmd+N` opens a window and `Ctrl+E` moves the caret, and
 * a tracker has no business taking either. Shift is the exception, because `?` is typed with it.
 *
 * Anything matched is also prevented: `ArrowDown` scrolls the page, `Backspace` used to navigate
 * back, and a shortcut that fires and lets the default through does two things at once.
 */
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
		/*
		 * `hotkeys` is a fresh object on every render, so this re-subscribes on every render - which
		 * is the point. The handlers close over the caller's current state, and a map captured once
		 * would fire last render's `date` on every arrow key. Swapping one window listener is
		 * cheaper than the `useCallback` on every handler that memoising this would demand
		 * (guidebook 11), and the array stays accurate rather than absent (guidebook 9).
		 */
	}, [hotkeys, enabled]);
}

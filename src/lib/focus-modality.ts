/**
 * Records whether the last thing the user did was point or type, as `data-modality` on the root.
 *
 * `:focus-visible` is meant to answer "should this focus be drawn?", and for direct interaction it
 * does. It gets it wrong for focus moved by script: Chrome treats **every** `element.focus()` call
 * as keyboard-like, so an element focused by code draws the ring even when the user was using a
 * mouse and even when nothing was focused beforehand. Measured, not assumed - `blur()` then
 * `focus()` on a button reports `:focus-visible` as true with the pointer as the only input the
 * page has seen.
 *
 * Every Radix overlay returns focus to its trigger when it closes, which is the right behaviour and
 * the reason a keyboard user is not dumped at the top of the document. But it is a `focus()` call,
 * so dismissing a menu, dialog, sheet or popover by clicking outside it left an accent ring behind
 * on the control that opened it, with nothing to explain it.
 *
 * So the ring is suppressed while the modality is `pointer` (see `styles/index.css`), and any key
 * press brings it straight back. Text fields keep theirs either way: a caret is not enough to say
 * which field is live, and clicking into one is exactly when that matters.
 */
export function observeFocusModality(root: HTMLElement = document.documentElement): () => void {
	const set = (modality: 'pointer' | 'keyboard') => () => {
		root.dataset.modality = modality;
	};
	const onPointer = set('pointer');
	const onKey = set('keyboard');

	// Capture phase, so a handler that stops propagation cannot leave the page describing the last
	// interaction as the wrong one - which would be a ring that appears or vanishes at random.
	document.addEventListener('pointerdown', onPointer, true);
	document.addEventListener('keydown', onKey, true);

	return () => {
		document.removeEventListener('pointerdown', onPointer, true);
		document.removeEventListener('keydown', onKey, true);
	};
}

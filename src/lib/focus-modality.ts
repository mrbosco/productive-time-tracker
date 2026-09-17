/** Records whether the last thing the user did was point or type, as `data-modality` on the root.
 * Chrome treats **every** `element.focus()` call as keyboard-like - measured, not assumed - so a
 * Radix overlay returning focus to its trigger left an accent ring on it after a click. The ring is
 * suppressed while the modality is `pointer` (see `styles/index.css`); text fields keep theirs. */
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

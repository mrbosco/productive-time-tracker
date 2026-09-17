import { afterEach, describe, expect, it } from 'vitest';
import { observeFocusModality } from './focus-modality';

let stop: (() => void) | undefined;

afterEach(() => {
	stop?.();
	stop = undefined;
	delete document.documentElement.dataset.modality;
});

describe('observeFocusModality', () => {
	it('says nothing until the user has done something', () => {
		stop = observeFocusModality();

		expect(document.documentElement.dataset.modality).toBeUndefined();
	});

	it('records a pointer', () => {
		stop = observeFocusModality();

		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

		expect(document.documentElement.dataset.modality).toBe('pointer');
	});

	it('records a key', () => {
		stop = observeFocusModality();

		document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));

		expect(document.documentElement.dataset.modality).toBe('keyboard');
	});

	/**
	 * The order is the whole point: a click that dismisses an overlay must not leave the page
	 * describing itself as keyboard-driven, and the next key press must bring the ring back.
	 */
	it('follows the most recent of the two', () => {
		stop = observeFocusModality();

		document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }));
		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
		expect(document.documentElement.dataset.modality).toBe('pointer');

		document.body.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
		expect(document.documentElement.dataset.modality).toBe('keyboard');
	});

	/** Capture phase, so a handler that stops propagation cannot hide the interaction. */
	it('records an interaction a handler swallows on the way up', () => {
		stop = observeFocusModality();
		const swallow = (event: Event) => {
			event.stopPropagation();
		};
		document.body.addEventListener('pointerdown', swallow);

		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

		expect(document.documentElement.dataset.modality).toBe('pointer');
		document.body.removeEventListener('pointerdown', swallow);
	});

	it('stops listening when torn down', () => {
		observeFocusModality()();

		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

		expect(document.documentElement.dataset.modality).toBeUndefined();
	});
});

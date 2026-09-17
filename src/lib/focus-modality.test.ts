import { afterEach, describe, expect, it } from 'vitest';
import { observeFocusModality } from './focus-modality';

let stop: (() => void) | undefined;

afterEach(() => {
	stop?.();
	stop = undefined;
	delete document.documentElement.dataset.modality;
});

describe('observeFocusModality', () => {
	it.each<[string, Event]>([
		['pointer', new Event('pointerdown', { bubbles: true })],
		['keyboard', new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' })],
	])('records a %s interaction', (expected, event) => {
		stop = observeFocusModality();

		document.body.dispatchEvent(event);

		expect(document.documentElement.dataset.modality).toBe(expected);
	});

	it('stops listening when torn down', () => {
		observeFocusModality()();

		document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

		expect(document.documentElement.dataset.modality).toBeUndefined();
	});
});

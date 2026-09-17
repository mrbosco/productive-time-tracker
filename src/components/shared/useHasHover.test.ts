import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@/__tests__/test-utils';
import { useHasHover } from './useHasHover';

afterEach(() => {
	Reflect.deleteProperty(window, 'matchMedia');
});

function stubMatchMedia(matches: boolean) {
	const listeners = new Set<() => void>();
	vi.stubGlobal(
		'matchMedia',
		vi.fn().mockReturnValue({
			matches,
			addEventListener: (_: string, listener: () => void) => listeners.add(listener),
			removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
		})
	);
}

describe('useHasHover', () => {
	/**
	 * jsdom implements no `matchMedia`, and every component test relies on that answer: the touch
	 * branch is the one they can drive, and the hover branch lives in `e2e/`.
	 */
	it('answers no on a browser that cannot be asked', () => {
		const { result } = renderHook(() => useHasHover());

		expect(result.current).toBe(false);
	});

	it('answers what the media query says', () => {
		stubMatchMedia(true);

		expect(renderHook(() => useHasHover()).result.current).toBe(true);
	});
});

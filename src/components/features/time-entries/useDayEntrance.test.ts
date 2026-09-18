import { describe, expect, it } from 'vitest';
import { renderHook } from '@/__tests__/test-utils';
import { useDayEntrance } from './useDayEntrance';

/** A different day per test: what is under test is module-level on purpose, so tests that shared a
 * date would be answering each other. */
describe('useDayEntrance', () => {
	/** The regression. Opening the entry form remounts the day underneath it, and the entrance
	 * replayed every time - the list appeared to reload when nothing had changed. */
	it('animates a day as it arrives, and not again when it remounts', () => {
		const arriving = renderHook(() => useDayEntrance('2026-09-15', true));
		expect(arriving.result.current).toBe(true);
		arriving.unmount();

		const remounted = renderHook(() => useDayEntrance('2026-09-15', true));

		expect(remounted.result.current).toBe(false);
	});

	/** A skeleton asks without settling, so the rows it stands in for still get the entrance. */
	it('leaves the entrance unspent while the day is still loading', () => {
		const loading = renderHook(() => useDayEntrance('2026-09-17'));
		expect(loading.result.current).toBe(true);
		loading.unmount();

		const loaded = renderHook(() => useDayEntrance('2026-09-17', true));

		expect(loaded.result.current).toBe(true);
	});
});

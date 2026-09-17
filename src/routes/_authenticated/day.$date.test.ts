import { QueryClient } from '@tanstack/react-query';
import { isRedirect } from '@tanstack/react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { testSession } from '@/__tests__/test-utils';
import { Route } from './day.$date';

afterEach(() => {
	vi.useRealTimers();
});

/**
 * The guard and the loader are called directly rather than through a rendered router: what matters
 * is the contract at the route boundary - reject a date that is not one, and start the day's
 * request - and driving it through navigation would test the router instead.
 *
 * The thrown redirect is returned rather than left to `toThrow`, so the assertion can look at the
 * navigation it describes instead of only that something was thrown.
 */
function runGuard(date: string): unknown {
	const beforeLoad = Route.options.beforeLoad as (args: { params: { date: string } }) => void;

	try {
		beforeLoad({ params: { date } });

		return undefined;
	} catch (thrown) {
		return thrown;
	}
}

function runLoader(date: string) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery');
	const loader = Route.options.loader as (args: unknown) => unknown;

	loader({ context: { queryClient, session: testSession }, params: { date } });

	return { prefetchQuery };
}

describe('the day route guard', () => {
	it('lets a real calendar date through, and redirects anything that is not one to today', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 16, 10, 0));

		expect(runGuard('2026-09-15')).toBeUndefined();

		for (const date of ['not-a-date', '2026-9-15', '2026-02-30', '']) {
			expect(isRedirect(runGuard(date))).toBe(true);
		}

		// The target lives under `options`: a thrown redirect is a Response subclass, and the
		// navigation it describes is not spread onto it. `replace`, so a mistyped URL does not
		// leave a step in the history that goes straight back to it (ADR-0007).
		expect(runGuard('not-a-date')).toMatchObject({
			options: { to: '/day/$date', params: { date: '2026-09-16' }, replace: true },
		});
	});
});

describe('the day route loader', () => {
	/**
	 * One request, started on navigation, under the key create, update and delete invalidate
	 * against. The day list, the week strip and the totals are all selections over it, so pinning
	 * the count here is what stops a second query for the same rows creeping back.
	 */
	it('starts one request on navigation, under the week key the writes invalidate', () => {
		const { prefetchQuery } = runLoader('2026-09-15');

		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ['week-entries', testSession.personId, '2026-09-14'] })
		);
		expect(prefetchQuery).toHaveBeenCalledTimes(1);
	});
});

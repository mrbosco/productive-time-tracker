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
	it('lets a real calendar date through', () => {
		expect(runGuard('2026-09-15')).toBeUndefined();
	});

	it.each(['not-a-date', '2026-9-15', '2026-13-45', '2026-02-30', ''])(
		'redirects %s to today rather than asking the API for it (ADR-0007)',
		(date) => {
			expect(isRedirect(runGuard(date))).toBe(true);
		}
	);

	it('redirects to today, and replaces rather than stacking history', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 16, 10, 0));

		// The target lives under `options`: a thrown redirect is a Response subclass, and the
		// navigation it describes is not spread onto it.
		expect(runGuard('not-a-date')).toMatchObject({
			options: { to: '/day/$date', params: { date: '2026-09-16' }, replace: true },
		});
	});
});

describe('the day route loader', () => {
	/**
	 * SPEC 4.2 asks for one request per selected day, started on navigation and cached under
	 * `(personId, date)`. The key is the contract create, update and delete invalidate against,
	 * so it is worth pinning here - nothing else asserts that the route and the hook agree on it.
	 */
	it('starts the day request on navigation, under the key the day is cached by', () => {
		const { prefetchQuery } = runLoader('2026-09-15');

		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ['time-entries', testSession.personId, '2026-09-15'] })
		);
	});
});

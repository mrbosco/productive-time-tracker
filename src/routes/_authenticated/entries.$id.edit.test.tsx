import { QueryClient } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import error404 from '../../../docs/api/samples/error-404.json';
import { ApiError } from '@/api/client';
import { renderWithProviders, screen, testSession, userEvent, waitFor } from '@/__tests__/test-utils';
import { server } from '@/mocks/node';
import { EditEntryErrorState, Route } from './entries.$id.edit';

/** One of the three entries recorded in `time-entries-day.json`, logged on the 15th. */
const ENTRY_ID = '162903873';
const ENTRY_DATE = '2026-09-15';
const MONDAY = '2026-09-14';

/**
 * The loader is called directly rather than through a rendered router: what matters is the contract
 * at the route boundary - resolve the entry before anything renders, and start the day behind it -
 * and driving it through navigation would test the router instead (as `day.$date.test.ts` does).
 */
function runLoader(id: string) {
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
	const prefetchQuery = vi.spyOn(queryClient, 'prefetchQuery');
	const loader = Route.options.loader as (args: unknown) => Promise<unknown>;

	return { prefetchQuery, result: loader({ context: { queryClient, session: testSession }, params: { id } }) };
}

describe('the edit route loader', () => {
	/**
	 * ADR-0007 singles this route out: "`ensureQueryData` remains the right call for
	 * `/entries/:id/edit` (US-3), where there is nothing to render until the entry is known." The
	 * awaited entry is also what the component seeds the form from.
	 */
	it('resolves the entry before the route renders', async () => {
		const { result } = runLoader(ENTRY_ID);

		await expect(result).resolves.toMatchObject({ id: ENTRY_ID, date: ENTRY_DATE });
	});

	/** The day behind the dialog, on the entry's own date rather than on whatever today is. */
	it('starts the day and week the entry belongs to, without awaiting them', async () => {
		const { prefetchQuery, result } = runLoader(ENTRY_ID);
		await result;

		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ['time-entries', testSession.personId, ENTRY_DATE] })
		);
		expect(prefetchQuery).toHaveBeenCalledWith(
			expect.objectContaining({ queryKey: ['week-totals', testSession.personId, MONDAY] })
		);
		expect(prefetchQuery).toHaveBeenCalledTimes(2);
	});

	/**
	 * Thrown, not swallowed: the route's `errorComponent` is what turns this into the design's
	 * "This entry no longer exists.", and it reads the status off the ApiError to tell that from a
	 * server that merely fell over.
	 */
	it('lets a missing entry reach the error component as an ApiError', async () => {
		server.use(http.get('*/time_entries/:id', () => HttpResponse.json(error404, { status: 404 })));
		const { result } = runLoader('999999999');

		await expect(result).rejects.toBeInstanceOf(ApiError);
	});
});

/**
 * The two states the loader's `await` makes possible, rendered straight from the route options.
 *
 * Neither is reachable from a component test through navigation - one needs a request that has not
 * settled, the other a router that has already caught the throw - and both are screens the design
 * draws (`04-edit-entry-mobile-loading.png`, `04-edit-entry-mobile-notfound.png`), so they are
 * asserted here rather than left as markup nothing ever runs.
 */
describe('the edit route states', () => {
	it('announces the wait, because skeletons carry no text (guidebook 18)', async () => {
		const PendingComponent = Route.options.pendingComponent as () => React.ReactElement;
		await renderWithProviders(<PendingComponent />, { session: testSession });

		expect(screen.getByRole('heading', { name: 'Edit entry' })).toBeInTheDocument();
		expect(screen.getByRole('status')).toHaveTextContent('Loading entry');
	});

	/**
	 * Rendered directly rather than through `Route.options.errorComponent`, which the router wraps
	 * into something that returns null outside a real match - so this is the only level below e2e
	 * that can see this screen at all. The 404 path is covered end to end in
	 * `e2e/entry-edit.spec.ts`; the generic failure has no other coverage.
	 */
	it('says a deleted entry is gone, and does not offer a retry that cannot work', async () => {
		await renderWithProviders(<EditEntryErrorState error={new ApiError(404, [], 'not found')} />, {
			session: testSession,
		});

		expect(screen.getByRole('alert')).toHaveTextContent('This entry no longer exists.');
		expect(screen.getByRole('link', { name: 'Go to today' })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
	});

	/**
	 * A server that fell over has deleted nothing. Saying the entry is gone would invite someone to
	 * redo work they never lost, so this branch retries instead - and still offers the way out,
	 * because a retry that keeps failing must not be the only control on a focus-trapped dialog.
	 */
	it.each([
		['a 500', new ApiError(500, [], 'server error')],
		['a dead socket', new ApiError(0, [], 'unreachable')],
		['something that is not an ApiError', new Error('boom')],
	])('offers a retry rather than claiming the entry is gone for %s', async (_name, error) => {
		await renderWithProviders(<EditEntryErrorState error={error} />, { session: testSession });

		expect(screen.getByRole('alert')).toHaveTextContent('Could not load this entry.');
		expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Go to today' })).toBeInTheDocument();
		expect(screen.queryByText('This entry no longer exists.')).not.toBeInTheDocument();
	});

	/**
	 * The boundary's own `reset` only re-renders a match that is still in its error state, which
	 * throws the same error straight back - a button that looks like a retry and is not one.
	 * Re-running the loader is what retrying means, and what `_authenticated.tsx` already does.
	 */
	it('re-runs the loader when the retry is pressed, rather than re-rendering the failure', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<EditEntryErrorState error={new ApiError(500, [], 'boom')} />, {
			session: testSession,
		});
		const invalidate = vi.spyOn(router, 'invalidate');

		await user.click(screen.getByRole('button', { name: 'Try again' }));

		expect(invalidate).toHaveBeenCalled();
	});

	/** A modal with no exit is a trap, and the close control must exist at every width (guidebook 18). */
	it('can be closed, and the close control is not hidden on desktop', async () => {
		const user = userEvent.setup();
		const { router } = await renderWithProviders(<EditEntryErrorState error={new ApiError(500, [], 'boom')} />, {
			session: testSession,
		});

		const close = screen.getByRole('button', { name: 'Close' });
		expect(close.className).not.toContain('md:hidden');

		await user.click(close);

		await waitFor(() => {
			expect(router.state.location.pathname).toMatch(/^\/day\/\d{4}-\d{2}-\d{2}$/);
		});
	});
});

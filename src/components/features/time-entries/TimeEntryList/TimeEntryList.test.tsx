import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimeEntryList } from './TimeEntryList';

function buildEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: '162903873',
		date: '2026-09-15',
		minutes: 90,
		note: 'Standup and time logging.',
		draft: false,
		serviceId: '16887825',
		service: { id: '16887825', name: 'Administrative work', dealName: null, dealId: null, companyName: null },
		createdAt: '2026-09-15T16:08:26.527+02:00',
		...overrides,
	};
}

const baseProps = {
	entries: [] as TimeEntry[] | undefined,
	isPending: false,
	onRetry: vi.fn(),
	date: '2026-09-15',
};

describe('TimeEntryList', () => {
	it('announces the wait while the day is loading', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} isPending />);

		expect(screen.getByRole('status')).toHaveTextContent('Loading entries');
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	/** R-7: one sentence and the primary action, never an illustration on its own. */
	it('shows the empty state when the day has no entries', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} />);

		expect(screen.getByText('Nothing logged for this day yet.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Add entry' })).toBeInTheDocument();
	});

	/** X-3 copies yesterday's entries in; the design puts the offer in this state. */
	it('shows Copy from yesterday, marked as not yet wired', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} />);

		expect(screen.getByRole('button', { name: /^Copy from yesterday/ })).toBeDisabled();
	});

	/**
	 * R-7 forbids an illustration on its own. It is decorative here, so it is hidden from
	 * assistive technology and the sentence beside it carries the meaning.
	 */
	it.each([
		['empty', [] as TimeEntry[]],
		['error', undefined],
	])('keeps the %s state readable without its illustration', async (_name, entries) => {
		const { container } = await renderWithProviders(<TimeEntryList {...baseProps} entries={entries} />);

		const illustration = container.querySelector('svg');

		expect(illustration).toHaveAttribute('aria-hidden', 'true');
		expect(screen.getByText(/Nothing logged for this day yet\.|Could not load entries\./)).toBeInTheDocument();
	});

	it('points the empty state at the day being shown', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} date="2026-09-10" />);

		expect(screen.getByRole('link', { name: 'Add entry' })).toHaveAttribute('href', '/entries/new?date=2026-09-10');
	});

	/** R-8. */
	it('announces the failure rather than swapping the text in silently', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} />);

		expect(screen.getByRole('alert')).toHaveTextContent('Could not load entries.');
	});

	it('keeps entries on screen when a refetch fails after they loaded', async () => {
		// A failed refetch leaves the previous day's entries in the cache; the list shows those
		// rather than replacing a readable list with an error card.
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[buildEntry()]} />);

		expect(screen.getAllByRole('listitem')).toHaveLength(1);
		expect(screen.queryByText('Could not load entries.')).not.toBeInTheDocument();
	});

	it('shows the error state and offers a retry when loading failed', async () => {
		const onRetry = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} onRetry={onRetry} />);

		expect(screen.getByText('Could not load entries.')).toBeInTheDocument();

		await user.click(screen.getByRole('button', { name: 'Retry' }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('does not offer Add entry while the day is failing to load', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} />);

		expect(screen.queryByRole('link', { name: 'Add entry' })).not.toBeInTheDocument();
	});

	it("lists the day's entries as a list", async () => {
		await renderWithProviders(
			<TimeEntryList
				{...baseProps}
				entries={[buildEntry({ id: 'a', minutes: 240 }), buildEntry({ id: 'b', minutes: 300 })]}
			/>
		);

		expect(screen.getAllByRole('listitem')).toHaveLength(2);
		expect(screen.getByText('4h')).toBeInTheDocument();
		expect(screen.getByText('5h')).toBeInTheDocument();
	});

	it('renders the entries in the order it is given them (A-7)', async () => {
		await renderWithProviders(
			<TimeEntryList
				{...baseProps}
				entries={[buildEntry({ id: 'a', note: 'Logged first' }), buildEntry({ id: 'b', note: 'Logged second' })]}
			/>
		);

		const items = screen.getAllByRole('listitem');

		expect(items[0]).toHaveTextContent('Logged first');
		expect(items[1]).toHaveTextContent('Logged second');
	});

	it('shows nothing but the entries once they are there', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[buildEntry()]} />);

		expect(screen.queryByText('Nothing logged for this day yet.')).not.toBeInTheDocument();
		expect(screen.queryByText('Could not load entries.')).not.toBeInTheDocument();
		expect(screen.queryByRole('status')).not.toBeInTheDocument();
	});
});

import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { buildService, renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { TimeEntryList } from './TimeEntryList';

function buildEntry(overrides: Partial<TimeEntry> = {}): TimeEntry {
	return {
		id: '162903873',
		date: '2026-09-15',
		minutes: 90,
		note: 'Standup and time logging.',
		draft: false,
		serviceId: '16887825',
		service: buildService(),
		createdAt: '2026-09-15T16:08:26.527+02:00',
		...overrides,
	};
}

const baseProps = {
	entries: [] as TimeEntry[] | undefined,
	isPending: false,
	onRetry: vi.fn(),
	date: '2026-09-15',
	onRequestDelete: vi.fn(),
};

describe('TimeEntryList', () => {
	it('announces the wait while the day is loading', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} isPending />);

		expect(screen.getByRole('status')).toHaveTextContent('Loading entries');
		expect(screen.queryByRole('list')).not.toBeInTheDocument();
	});

	/** One sentence and the primary action, never an illustration on its own. */
	it('shows the empty state when the day has no entries', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} date="2026-09-10" />);

		expect(screen.getByText('Nothing logged for this day yet.')).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Add entry' })).toHaveAttribute('href', '/entries/new?date=2026-09-10');
	});

	/** The design puts the offer to copy yesterday's entries in this state. */
	it('offers to copy yesterday into an empty day', async () => {
		const onCopyFromYesterday = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} onCopyFromYesterday={onCopyFromYesterday} />);

		await user.click(screen.getByRole('button', { name: 'Copy from yesterday' }));

		expect(onCopyFromYesterday).toHaveBeenCalledTimes(1);
	});

	/** The copy is N sequential POSTs, so the offer says so rather than sitting there looking inert. */
	it('says a copy is under way rather than looking idle', async () => {
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[]} onCopyFromYesterday={vi.fn()} isCopying />);

		expect(screen.getByRole('button', { name: 'Copying...' })).toBeDisabled();
	});

	it('announces the failure rather than swapping the text in silently, and offers a retry', async () => {
		const onRetry = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<TimeEntryList {...baseProps} entries={undefined} onRetry={onRetry} />);

		expect(screen.getByRole('alert')).toHaveTextContent('Could not load entries.');

		await user.click(screen.getByRole('button', { name: 'Retry' }));

		expect(onRetry).toHaveBeenCalledTimes(1);
	});

	it('keeps entries on screen when a refetch fails after they loaded', async () => {
		// A failed refetch leaves the previous day's entries in the cache; the list shows those
		// rather than replacing a readable list with an error card.
		await renderWithProviders(<TimeEntryList {...baseProps} entries={[buildEntry()]} />);

		expect(screen.getAllByRole('listitem')).toHaveLength(1);
		expect(screen.queryByText('Could not load entries.')).not.toBeInTheDocument();
	});

	it("lists the day's entries in the order it is given them", async () => {
		await renderWithProviders(
			<TimeEntryList
				{...baseProps}
				entries={[buildEntry({ id: 'a', note: 'Logged first' }), buildEntry({ id: 'b', note: 'Logged second' })]}
			/>
		);

		const items = screen.getAllByRole('listitem');

		expect(items).toHaveLength(2);
		expect(items[0]).toHaveTextContent('Logged first');
		expect(items[1]).toHaveTextContent('Logged second');
	});
});

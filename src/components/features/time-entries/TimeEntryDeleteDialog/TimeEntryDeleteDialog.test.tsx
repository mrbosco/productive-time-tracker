import { describe, expect, it, vi } from 'vitest';
import type { TimeEntry } from '@/api/types';
import { buildService, renderWithProviders, screen } from '@/__tests__/test-utils';
import { TimeEntryDeleteDialog } from './TimeEntryDeleteDialog';

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

function renderDialog(entry: TimeEntry | null) {
	return renderWithProviders(<TimeEntryDeleteDialog entry={entry} onOpenChange={vi.fn()} onConfirm={vi.fn()} />);
}

describe('TimeEntryDeleteDialog', () => {
	/**
	 * `toPlainText` keeps the breaks between blocks, so a note written as a list would otherwise
	 * arrive as every bullet run into one sentence. The design asks for the first line.
	 */
	it('names the entry by its duration and the first line of its description', async () => {
		await renderDialog(
			buildEntry({ note: '<ul><li><p>Mapped the payload</p></li><li><p>And the service</p></li></ul>' })
		);

		const dialog = screen.getByRole('dialog', { name: 'Delete this entry?' });

		expect(dialog).toHaveTextContent('1h 30m \u00b7 Mapped the payload');
		expect(dialog).not.toHaveTextContent('And the service');
	});

	/** Markup with no words in it is no description, the same reading the card takes (ADR-0010). */
	it('names an entry with no description by its duration alone', async () => {
		await renderDialog(buildEntry({ note: '<p></p>' }));

		// The duration and no dangling separator after it.
		expect(screen.getByRole('dialog', { name: 'Delete this entry?' })).toHaveTextContent('1h 30m');
		expect(screen.getByRole('dialog', { name: 'Delete this entry?' })).not.toHaveTextContent('1h 30m \u00b7');
	});
});

import type { TimeEntry } from '@/api/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog';
import { formatDuration } from '@/lib/duration';
import { toPlainText } from '@/lib/note';

interface TimeEntryDeleteDialogProps {
	/** The entry being asked about, or `null` when nothing is. Open is derived from it. */
	entry: TimeEntry | null;
	onOpenChange: (open: boolean) => void;
	onConfirm: (entry: TimeEntry) => void;
}

/**
 * The question asked before an entry is deleted (R-12, A-10).
 *
 * One component for both screens that ask it - the day view's card menu and the edit form's
 * `Delete entry` - so the question is asked once, in one place, rather than at two call sites that
 * could drift apart. The design draws one dialog (`05-global-confirm-delete.png`), and copy that
 * disagreed with itself depending on where the user started would be the same bug the form's own
 * `close()` exists to avoid.
 *
 * Open is derived from `entry` rather than tracked beside it: a dialog that is up but has no entry
 * to name is a state neither caller can usefully be in.
 */
export function TimeEntryDeleteDialog({ entry, onOpenChange, onConfirm }: TimeEntryDeleteDialogProps) {
	if (entry === null) return null;

	// The first line, which is what the design asks for (brief 4). `toPlainText` survives ADR-0010
	// for exactly this - which entry, not what its bullets were - but it keeps the breaks between
	// blocks, so a note written as four bullets would otherwise run them together into one
	// sentence. An entry with no description is named by its duration alone rather than by a
	// dangling separator.
	const [firstLine = ''] = toPlainText(entry.note).trim().split('\n');

	return (
		<ConfirmDialog
			open
			onOpenChange={onOpenChange}
			title="Delete this entry?"
			confirmLabel="Delete"
			confirmVariant="destructive"
			onConfirm={() => {
				onConfirm(entry);
			}}
			cancelLabel="Cancel"
		>
			{/*
			 * Clamped as well as shortened: one line of a note has no length limit of its own, and
			 * a long one would grow a 400px dialog until `Delete` sat below the fold on a phone -
			 * the destructive control becoming harder to reach than the safe one is the wrong
			 * direction to fail in (N-4).
			 */}
			<span className="line-clamp-3">
				<span className="font-medium text-ink tabular-nums">{formatDuration(entry.minutes)}</span>
				{firstLine === '' ? '' : ` · ${firstLine}`}
			</span>
		</ConfirmDialog>
	);
}

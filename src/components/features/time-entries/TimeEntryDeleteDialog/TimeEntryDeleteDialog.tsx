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

/** The question asked before an entry is deleted, by both screens that ask it, so the copy cannot
 * disagree with itself. Open is derived from `entry` rather than tracked beside it. */
export function TimeEntryDeleteDialog({ entry, onOpenChange, onConfirm }: TimeEntryDeleteDialogProps) {
	if (entry === null) return null;

	// The first line only. `toPlainText` survives ADR-0010 for exactly this - which entry, not what
	// its bullets were - but it keeps the breaks between
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
			{/* Clamped as well as shortened: a long note would grow a 400px dialog until `Delete`
						     sat below the fold, making the destructive control harder to reach than the safe one. */}
			<span className="line-clamp-3">
				<span className="font-medium text-ink tabular-nums">{formatDuration(entry.minutes)}</span>
				{firstLine === '' ? '' : ` · ${firstLine}`}
			</span>
		</ConfirmDialog>
	);
}

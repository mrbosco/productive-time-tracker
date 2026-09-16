import type { TimeEntry } from '@/api/types';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog';
import { formatDuration } from '@/lib/duration';
import { toPlainText } from '@/lib/note';

interface DeleteEntryDialogProps {
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
export function DeleteEntryDialog({ entry, onOpenChange, onConfirm }: DeleteEntryDialogProps) {
	if (entry === null) return null;

	// `toPlainText` survives ADR-0010 for exactly this: which entry, not what its bullets were. A
	// list rendered inside the sentence would be the wrong shape, and an entry with no description
	// is named by its duration alone rather than by a dangling separator.
	const note = toPlainText(entry.note).trim();

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
			<span className="font-medium text-ink tabular-nums">{formatDuration(entry.minutes)}</span>
			{note === '' ? '' : ` · ${note}`}
		</ConfirmDialog>
	);
}

import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog';

interface UnsavedChangesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** What would be lost, from `summariseUnsavedEntry`. */
	duration: string | null;
	hasNote: boolean;
	onDiscard: () => void;
}

/**
 * Asked before a dismissal throws away a half-written entry (Improvements 10).
 *
 * `Continue editing` is the primary and takes focus: the safe choice gets the weight. `Discard
 * changes` is quiet rather than red - retyping a draft is a nuisance, not the irreversible loss
 * that deleting a saved entry is, and colouring it destructive would cry wolf beside a dialog that
 * means it.
 *
 * `initialFocus="confirm"` is the exception `ConfirmDialog` defaults against, and for the reason
 * the default exists: there the affirmative deletes something, here it is the way back.
 *
 * What is left here is the prose. US-4's delete confirm was the second caller the chrome was
 * waiting for, so it now lives in `shared/ConfirmDialog` (SPEC 6.1).
 */
export function UnsavedChangesDialog({ open, onOpenChange, duration, hasNote, onDiscard }: UnsavedChangesDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			onOpenChange={onOpenChange}
			title="Save your changes?"
			confirmLabel="Continue editing"
			onConfirm={() => {
				onOpenChange(false);
			}}
			cancelLabel="Discard changes"
			onCancel={onDiscard}
			initialFocus="confirm"
		>
			This entry has not been saved.{' '}
			{duration === null ? (
				hasNote ? (
					'A description would be lost.'
				) : (
					'Your changes would be lost.'
				)
			) : (
				<>
					<span className="font-medium text-ink tabular-nums">{duration}</span>
					{hasNote ? ' and a description' : ''} would be lost.
				</>
			)}
		</ConfirmDialog>
	);
}

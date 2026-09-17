import { ConfirmDialog } from '@/components/shared/ConfirmDialog/ConfirmDialog';

interface UnsavedChangesDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	duration: string | null;
	hasNote: boolean;
	onDiscard: () => void;
}

/** Asked before a dismissal throws away a half-written entry. `initialFocus="confirm"` is the
 * exception `ConfirmDialog` defaults against, and for the reason the default exists: here the
 * affirmative is the way back, so the safe choice still takes focus. */
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

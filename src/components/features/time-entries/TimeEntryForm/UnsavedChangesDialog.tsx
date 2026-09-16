import { useRef } from 'react';
import { Button } from '@/components/core/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/core/Dialog';

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
 * `Continue editing` is the primary: the safe choice gets the weight. `Discard changes` is quiet
 * rather than red - retyping a draft is a nuisance, not the irreversible loss that deleting a
 * saved entry is, and colouring it destructive would cry wolf before US-4 has anything to say.
 *
 * Kept beside the form rather than promoted to `shared/ConfirmDialog` yet. It has one caller, and
 * US-4's delete confirm is the second one that would justify the abstraction - the same reasoning
 * that leaves the list's empty and error states inside `TimeEntryList` (SPEC 6.1).
 */
export function UnsavedChangesDialog({ open, onOpenChange, duration, hasNote, onDiscard }: UnsavedChangesDialogProps) {
	const continueEditingRef = useRef<HTMLButtonElement>(null);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{/* Above the form's own layer, so the form dims behind this rather than staying lit. */}
			<DialogContent
				overlayClassName="z-40"
				className="top-1/2 left-1/2 z-41 w-[min(400px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2 rounded-entry p-6 shadow-dialog"
				onOpenAutoFocus={(event) => {
					// Radix would focus the first tabbable, which is Discard. Enter on a prompt you
					// did not mean to summon would then throw the draft away - so the safe choice
					// takes focus, which is also the one the design gives the weight.
					event.preventDefault();
					continueEditingRef.current?.focus();
				}}
			>
				<DialogTitle className="mb-2.5">Save your changes?</DialogTitle>

				<DialogDescription className="mb-5">
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
				</DialogDescription>

				<div className="flex justify-end gap-2.5">
					<Button variant="outline" size="sm" onClick={onDiscard}>
						Discard changes
					</Button>
					<Button
						ref={continueEditingRef}
						size="sm"
						onClick={() => {
							onOpenChange(false);
						}}
					>
						Continue editing
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

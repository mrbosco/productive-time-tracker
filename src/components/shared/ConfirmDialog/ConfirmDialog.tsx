import { useRef, type ReactNode } from 'react';
import { Button } from '@/components/core/Button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/core/Dialog';

interface ConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	/** What is at stake, as prose. Rendered inside the dialog's description. */
	children: ReactNode;
	confirmLabel: string;
	onConfirm: () => void;
	cancelLabel: string;
	/** Defaults to closing. Given only when declining has to do something of its own. */
	onCancel?: () => void;
	confirmVariant?: 'default' | 'destructive';
	initialFocus?: 'confirm' | 'cancel';
}

/** The question asked before something is lost. `initialFocus` defaults to cancel, which is why this
 * exists rather than each caller assembling a `Dialog`: Radix focuses the first tabbable, so Enter
 * would otherwise take the affirmative. */
export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	children,
	confirmLabel,
	onConfirm,
	cancelLabel,
	onCancel,
	confirmVariant = 'default',
	initialFocus = 'cancel',
}: ConfirmDialogProps) {
	const focusRef = useRef<HTMLButtonElement>(null);

	function cancel() {
		if (onCancel === undefined) {
			onOpenChange(false);

			return;
		}

		onCancel();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				overlayClassName="z-40"
				className="top-1/2 left-1/2 z-41 w-[min(400px,calc(100%-40px))] -translate-x-1/2 -translate-y-1/2 rounded-entry p-6 shadow-dialog"
				onOpenAutoFocus={(event) => {
					event.preventDefault();
					focusRef.current?.focus();
				}}
			>
				<DialogTitle className="mb-2.5">{title}</DialogTitle>

				<DialogDescription className="mb-5">{children}</DialogDescription>

				{/* Confirm on the right, which is where the design puts it in both dialogs. */}
				<div className="flex justify-end gap-2.5">
					<Button ref={initialFocus === 'cancel' ? focusRef : undefined} variant="outline" size="sm" onClick={cancel}>
						{cancelLabel}
					</Button>
					<Button
						ref={initialFocus === 'confirm' ? focusRef : undefined}
						variant={confirmVariant}
						size="sm"
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

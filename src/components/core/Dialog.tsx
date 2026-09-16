import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * shadcn's Dialog on Radix, restyled to the design tokens (guidebook 16).
 *
 * Radix is what makes this satisfy guidebook 18 without hand-written code: focus is trapped while
 * the dialog is open and returned to the trigger on close, Escape and the backdrop dismiss, and
 * everything behind is marked `aria-hidden` so a screen reader cannot wander into the page under
 * the modal.
 *
 * `overlayClassName` exists for one case: a dialog opened over another dialog has to sit above
 * the first one's content, not just above its overlay, or the form underneath stays undimmed and
 * still looks live.
 *
 * `DialogContent` carries no position of its own. The two dialogs in this design sit in different
 * places - the entry form fills the screen on mobile and centres at 560px on desktop, US-4's
 * confirm is a 340px box at both widths - and a default here would only be something each caller
 * had to override. What the primitive is for is the portal, the overlay and the Radix wiring.
 */
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			data-slot="dialog-overlay"
			className={cn('fixed inset-0 z-30 animate-overlay-in bg-ink/30', className)}
			{...props}
		/>
	);
}

function DialogContent({
	className,
	overlayClassName,
	children,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { overlayClassName?: string }) {
	return (
		<DialogPrimitive.Portal>
			<DialogOverlay className={overlayClassName} />
			<DialogPrimitive.Content
				data-slot="dialog-content"
				className={cn('fixed z-31 animate-overlay-in bg-surface text-ink outline-hidden', className)}
				{...props}
			>
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

/**
 * Required by Radix, which warns without one and leaves the dialog unnamed for a screen reader.
 * Visually it is the screen title on mobile and the dialog heading on desktop, so the size comes
 * from the caller.
 */
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('text-[17px] font-bold tracking-[-.01em]', className)}
			{...props}
		/>
	);
}

function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="dialog-description"
			className={cn('text-meta leading-[1.45] text-muted', className)}
			{...props}
		/>
	);
}

export { Dialog, DialogClose, DialogContent, DialogDescription, DialogOverlay, DialogTitle, DialogTrigger };

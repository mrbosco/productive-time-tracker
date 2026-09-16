import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * The settings surface: a bottom sheet on mobile, a right-hand side panel from `md`
 * (`05-global-default-service.png` and its desktop twin).
 *
 * Radix's Dialog again rather than a second primitive - a sheet is a modal that enters from an
 * edge, and reusing it keeps the focus trap, Escape and backdrop dismissal identical to
 * `Dialog`'s (guidebook 18). One element that restyles across the breakpoint rather than two
 * hidden by CSS, so only one is ever in the accessibility tree.
 */
function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
	return (
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay className="fixed inset-0 z-30 animate-overlay-in bg-ink/30" />
			<DialogPrimitive.Content
				data-slot="sheet-content"
				className={cn(
					'fixed z-31 animate-sheet-up bg-surface text-ink outline-hidden',
					'inset-x-0 bottom-0 rounded-t-panel px-5 pt-5 pb-7',
					'md:inset-y-0 md:right-0 md:left-auto md:w-[420px] md:animate-none md:rounded-none md:border-l md:border-line md:p-7',
					className
				)}
				{...props}
			>
				{/* The grabber the design draws on the mobile sheet. Decoration: the sheet is
				    dismissed with Escape, the backdrop or the control that opened it. */}
				<div aria-hidden="true" className="mx-auto mb-[18px] h-1 w-9 rounded-pill bg-line md:hidden" />
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

/** 17px on the mobile sheet, 22px on the desktop panel, as drawn. */
function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			data-slot="sheet-title"
			className={cn('text-[17px] font-bold tracking-[-.01em] md:text-title md:tracking-[-.02em]', className)}
			{...props}
		/>
	);
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			data-slot="sheet-description"
			className={cn('text-caption text-muted', className)}
			{...props}
		/>
	);
}

export { Sheet, SheetContent, SheetDescription, SheetTitle };

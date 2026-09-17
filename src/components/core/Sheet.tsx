import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** The settings surface: a bottom sheet on mobile, a right-hand side panel from `md`. Radix's Dialog
 * again rather than a second primitive, so the focus trap and dismissal behaviour are identical. */
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
				<div aria-hidden="true" className="mx-auto mb-[18px] h-1 w-9 rounded-pill bg-line md:hidden" />
				{children}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

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

import { Dialog as DialogPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/** shadcn's Dialog on Radix, restyled to the design tokens. `overlayClassName` exists for one case: a
 * dialog over another has to sit above the first one's content, not just its overlay. */
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

/** Required by Radix, which warns without one and leaves the dialog unnamed. The size comes from
 * the caller: a screen title on mobile, a dialog heading on desktop. */
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

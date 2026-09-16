import * as React from 'react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * shadcn's DropdownMenu on Radix, restyled to the design tokens (guidebook 16).
 *
 * Trimmed to the six parts the app uses. The generated file also ships checkbox items, radio
 * groups, submenus and a shortcut slot; none of the menus in the design have any of those, and
 * an unused export is a thing to keep working for nothing. `shadcn add` can regenerate them.
 *
 * Radix handles focus trapping, arrow keys, typeahead and Escape, and returns focus to the
 * trigger on close (guidebook 18).
 */
function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
	return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
	return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
	className,
	sideOffset = 8,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
	return (
		<DropdownMenuPrimitive.Portal>
			<DropdownMenuPrimitive.Content
				data-slot="dropdown-menu-content"
				sideOffset={sideOffset}
				className={cn(
					'z-50 min-w-48 overflow-hidden rounded-input border border-line bg-surface p-1 text-ink shadow-menu',
					'origin-(--radix-dropdown-menu-content-transform-origin)',
					className
				)}
				{...props}
			/>
		</DropdownMenuPrimitive.Portal>
	);
}

function DropdownMenuItem({
	className,
	variant = 'default',
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	variant?: 'default' | 'destructive';
}) {
	return (
		<DropdownMenuPrimitive.Item
			data-slot="dropdown-menu-item"
			data-variant={variant}
			className={cn(
				'relative flex min-h-11 cursor-default items-center gap-3 rounded-input px-3 text-base outline-hidden select-none',
				'focus:bg-selection focus:text-accent-dark',
				'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				'data-[variant=destructive]:text-danger data-[variant=destructive]:focus:bg-danger-bg data-[variant=destructive]:focus:text-danger',
				"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
				className
			)}
			{...props}
		/>
	);
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
	return (
		<DropdownMenuPrimitive.Label
			data-slot="dropdown-menu-label"
			className={cn('px-3 py-2 text-label font-medium text-muted', className)}
			{...props}
		/>
	);
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			data-slot="dropdown-menu-separator"
			className={cn('-mx-1 my-1 h-px bg-line', className)}
			{...props}
		/>
	);
}

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
};

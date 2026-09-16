import { Popover as PopoverPrimitive } from 'radix-ui';
import type * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * shadcn's Popover on Radix, restyled to the design tokens (guidebook 16).
 *
 * Trimmed to the three parts the app uses; the generated file also ships an anchor, header, title
 * and description, none of which any popover in the design has. The generated animation classes
 * went with them: they are `tailwindcss-animate` utilities, which this project does not install,
 * and the design specifies motion on colour and background only.
 *
 * Radix handles the focus trap, Escape, outside-click dismissal and returning focus to the
 * trigger on close (guidebook 18).
 */
function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	align = 'center',
	sideOffset = 8,
	// Keeps the panel off the screen edge on a 390px viewport, where a 328px calendar anchored to
	// a centred label would otherwise sit flush against it.
	collisionPadding = 16,
	...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot="popover-content"
				align={align}
				sideOffset={sideOffset}
				collisionPadding={collisionPadding}
				className={cn(
					'z-50 rounded-entry border border-line bg-surface p-4 text-ink shadow-popover outline-hidden',
					className
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

export { Popover, PopoverContent, PopoverTrigger };

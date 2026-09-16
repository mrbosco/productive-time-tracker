import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/**
 * shadcn's Button, restyled to the design tokens (guidebook 16: copied in, edited here).
 *
 * Every button in the design is a pill. Sizes carry the design's tap targets: `default` is 52px
 * on mobile and 48px from `md` up, and icon buttons stay 44 x 44 even where the glyph is 18px,
 * because a 44px target is the floor on touch (design README §1).
 *
 * Disabled is a flatter fill rather than `opacity-50`: a half-transparent button over the canvas
 * drops its label under AA contrast, and the login screen's disabled state is on screen from the
 * first paint.
 */
const buttonVariants = cva(
	cn(
		'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-medium whitespace-nowrap',
		// Not `transition-colors`: that list includes `outline-color`, so the focus ring
		// would fade in from the text colour instead of appearing.
		'transition-[color,background-color,border-color] duration-(--duration-ui) ease-(--ease-ui)',
		'disabled:pointer-events-none',
		"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
	),
	{
		variants: {
			variant: {
				default: 'bg-accent text-on-accent hover:bg-accent-dark disabled:bg-subtle disabled:text-muted',
				destructive: 'bg-danger text-on-accent hover:bg-danger/90 disabled:bg-danger-bg disabled:text-muted',
				outline: 'border border-line bg-surface text-ink hover:bg-subtle disabled:text-muted',
				secondary: 'bg-subtle text-ink hover:bg-selection disabled:text-muted',
				ghost: 'text-ink hover:bg-subtle disabled:text-muted',
				link: 'text-accent underline-offset-4 hover:underline disabled:text-muted',
			},
			size: {
				// 52px at every width: the design centres the same card on the desktop canvas
				// rather than resizing anything, so there is no narrower desktop control.
				default: 'h-13 gap-2.5 px-6 text-list',
				sm: 'h-11 px-4 text-list',
				icon: 'size-11',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot.Root : 'button';

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };

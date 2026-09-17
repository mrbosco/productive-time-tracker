import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

/** shadcn's Button, copied in and restyled to the design tokens. Icon buttons stay 44 x 44 even where
 * the glyph is 18px; disabled is a flatter fill, since `opacity-50` drops the label under AA. */
const buttonVariants = cva(
	cn(
		'inline-flex shrink-0 items-center justify-center gap-2 rounded-control font-medium whitespace-nowrap',
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

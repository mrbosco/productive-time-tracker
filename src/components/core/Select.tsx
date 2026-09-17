import * as React from 'react';
import { cn } from '@/lib/utils';

/** A native `<select>`, restyled to the design tokens. The platform supplies listbox semantics,
 * type-ahead, the keyboard model and the OS picker on a phone, for a list that is flat and short. */
function Select({ className, children, ...props }: React.ComponentProps<'select'>) {
	return (
		<div className="relative flex items-center">
			<select
				data-slot="select"
				className={cn(
					'h-14 w-full appearance-none rounded-input border border-line bg-surface pr-11 pl-4',
					'text-base text-ink transition-[color,background-color,border-color]',
					'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted',
					'aria-invalid:border-danger',
					className
				)}
				{...props}
			>
				{children}
			</select>
			<svg
				width="18"
				height="18"
				viewBox="0 0 20 20"
				aria-hidden="true"
				className="pointer-events-none absolute right-4 text-muted"
			>
				<path d="M4 8.2h12L10 15 4 8.2Z" fill="currentColor" />
			</svg>
		</div>
	);
}

export { Select };

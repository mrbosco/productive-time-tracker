import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * A native `<select>`, restyled to the design tokens.
 *
 * Native rather than Radix's Select, which ADR-0006 does not name and nothing else here needs: the
 * design draws exactly a bordered box with a caret, which is what a styled native control is, and
 * the platform then supplies the listbox semantics, type-ahead, keyboard model and - on a phone -
 * the OS picker, for a list of services that is flat and short.
 *
 * This is not the trade ADR-0009 rejected for the date picker. That one turned on the trigger being
 * a words label in a position `showPicker()` cannot control; there is no such constraint here.
 *
 * The caret is drawn rather than left to the browser, because the platform's own arrow is the one
 * part of a native select that looks different on every OS.
 */
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

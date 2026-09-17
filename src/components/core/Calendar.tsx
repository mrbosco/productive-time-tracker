import type * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '@/lib/utils';

/** shadcn's Calendar on react-day-picker (ADR-0009), restyled and trimmed to one day from one month.
 * The library owns the part worth a dependency: grid roles, roving focus and the keyboard model. */
function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="flex-none">
			<path
				d={
					direction === 'left'
						? 'M12.6 3.4 6 10l6.6 6.6 1.7-1.7L9.4 10l4.9-4.9-1.7-1.7Z'
						: 'M7.4 3.4 5.7 5.1 10.6 10l-4.9 4.9 1.7 1.7L14 10 7.4 3.4Z'
				}
				fill="currentColor"
			/>
		</svg>
	);
}

const ARROW_BUTTON =
	'inline-flex size-9 items-center justify-center rounded-pill text-muted transition-colors duration-ui ease-ui hover:bg-subtle hover:text-ink disabled:opacity-40';

function Calendar({
	className,
	classNames,
	showOutsideDays = false,
	// Monday first, as the design draws it and as the week strip runs. react-day-picker's default
	// locale is en-US, which starts the week on Sunday.
	weekStartsOn = 1,
	formatters,
	...props
}: React.ComponentProps<typeof DayPicker>) {
	return (
		<DayPicker
			showOutsideDays={showOutsideDays}
			weekStartsOn={weekStartsOn}
			formatters={{
				// `M T W T F S S`: the design's single-letter column headers. The day buttons keep
				// their own full `aria-label` ("Thursday, September 10th, 2026"), so the repeated
				// letters are never what a screen reader has to disambiguate from.
				formatWeekdayName: (date) => date.toLocaleString('en-US', { weekday: 'narrow' }),
				...formatters,
			}}
			className={cn('w-fit', className)}
			classNames={{
				root: 'w-fit',
				months: 'relative flex flex-col',
				month: 'flex flex-col gap-1',
				nav: 'absolute top-0 right-0 flex items-center gap-1',
				button_previous: ARROW_BUTTON,
				button_next: ARROW_BUTTON,
				month_caption: 'flex h-9 items-center',
				caption_label: 'text-list font-medium',
				month_grid: 'w-full border-collapse',
				weekdays: 'flex gap-0.5',
				weekday: 'w-10 pb-1 text-micro font-normal text-muted',
				week: 'flex w-full gap-0.5',
				day: 'p-0',
				day_button:
					'size-10 rounded-[10px] text-meta tabular-nums transition-colors duration-ui ease-ui hover:bg-subtle',
				/* Painted on the cell, not the button: react-day-picker v10 puts `data-selected` on the
				 * surrounding `td`, so the generated `data-selected-single:*` classes never fire. The
				 * cell is exactly the button's size (`day` is `p-0`). */
				selected:
					'rounded-[10px] bg-accent [&>button]:font-medium [&>button]:text-on-accent [&>button]:hover:bg-transparent',
				today: 'font-medium',
				outside: 'text-muted/60',
				disabled: 'opacity-40',
				...classNames,
			}}
			components={{
				PreviousMonthButton: ({ className: buttonClassName, ...buttonProps }) => (
					<button type="button" className={buttonClassName} {...buttonProps}>
						<ChevronIcon direction="left" />
					</button>
				),
				NextMonthButton: ({ className: buttonClassName, ...buttonProps }) => (
					<button type="button" className={buttonClassName} {...buttonProps}>
						<ChevronIcon direction="right" />
					</button>
				),
			}}
			{...props}
		/>
	);
}

export { Calendar };

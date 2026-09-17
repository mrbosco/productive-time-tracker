import { type ReactNode, useState } from 'react';
import { Calendar } from '@/components/core/Calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/Popover';
import { parseIsoDate, toIsoDate } from '@/lib/date';

interface DatePickerProps {
	/** The selected calendar day, `YYYY-MM-DD`. */
	value: string;
	onSelect: (date: string) => void;
	/** The control that opens the calendar. Rendered as the popover trigger itself, via `asChild`. */
	children: ReactNode;
}

/** A calendar popover over an ISO date string. `Date` never leaves this component: everything above
 * speaks `YYYY-MM-DD`, so one place turns a calendar day into a `Date` and never crosses UTC. */
export function DatePicker({ value, onSelect, children }: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);
	const selected = parseIsoDate(value);

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>{children}</PopoverTrigger>

			<PopoverContent align="center" aria-label="Choose a date">
				<Calendar
					mode="single"
					required
					selected={selected}
					// Without this the calendar opens on the current month rather than the
					// selected one, so stepping back a few months and reopening loses the place.
					defaultMonth={selected}
					onSelect={(date: Date) => {
						onSelect(toIsoDate(date));
						setIsOpen(false);
					}}
					autoFocus
				/>
			</PopoverContent>
		</Popover>
	);
}

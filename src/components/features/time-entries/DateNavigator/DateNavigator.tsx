import { useDayEntrance } from '@/components/features/time-entries/useDayEntrance';
import { DatePicker } from '@/components/shared/DatePicker/DatePicker';
import { addDays, formatDayLabel, todayIso } from '@/lib/date';

interface DateNavigatorProps {
	date: string;
	onSelect: (date: string) => void;
	/** Injected so the relative wording is testable without faking the clock. */
	today?: string;
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
	return (
		<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" className="md:size-[18px]">
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

function CaretIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-muted md:size-[18px]">
			<path d="M4 8.2h12L10 15 4 8.2Z" fill="currentColor" />
		</svg>
	);
}

/** Previous / next day around a label in words that opens a calendar, plus a `Today`. The label is the
 * page's `h1` and `__root.tsx` focuses it after every navigation, so stepping a day announces it. */
export function DateNavigator({ date, onSelect, today = todayIso() }: DateNavigatorProps) {
	const entrance = useDayEntrance(date) ? 'animate-day-in' : '';
	const isToday = date === today;
	const arrowClassName =
		'flex size-11 flex-none place-items-center justify-center rounded-control text-muted transition-colors duration-ui ease-ui hover:bg-subtle hover:text-ink md:border md:border-line md:bg-surface';

	return (
		<div className="flex w-full items-center gap-1 md:w-auto md:gap-2">
			<button
				type="button"
				aria-label="Previous day"
				className={`${arrowClassName} md:order-2`}
				onClick={() => {
					onSelect(addDays(date, -1));
				}}
			>
				<ChevronIcon direction="left" />
			</button>

			<h1 tabIndex={-1} className="flex min-w-0 flex-1 justify-center md:order-1 md:mr-4 md:flex-none">
				<DatePicker value={date} onSelect={onSelect}>
					<button
						type="button"
						className="duration-ui flex h-11 items-center gap-2 rounded-input px-1 text-base font-medium tracking-[-.01em] whitespace-nowrap transition-colors ease-ui hover:bg-subtle md:px-0 md:text-[30px] md:font-semibold md:tracking-[-.035em]"
					>
						<span key={date} className={entrance}>
							{formatDayLabel(date, today)}
						</span>
						<CaretIcon />
					</button>
				</DatePicker>
			</h1>

			<button
				type="button"
				aria-label="Next day"
				className={`${arrowClassName} md:order-3`}
				onClick={() => {
					onSelect(addDays(date, 1));
				}}
			>
				<ChevronIcon direction="right" />
			</button>

			{/* Absent rather than disabled when today is selected: a control that cannot do
			 * anything is still a tab stop and still reads out to a screen reader. */}
			{!isToday && (
				<button
					type="button"
					className="duration-ui h-9 flex-none rounded-control border border-line bg-surface px-3.5 text-label font-medium transition-colors ease-ui hover:bg-subtle md:order-4"
					onClick={() => {
						onSelect(today);
					}}
				>
					Today
				</button>
			)}
		</div>
	);
}

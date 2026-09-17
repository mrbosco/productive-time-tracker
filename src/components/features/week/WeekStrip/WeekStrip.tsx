import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import {
	dayOfMonth,
	formatDayShort,
	formatWeekdayAndDay,
	formatWeekdayInitial,
	isWeekend,
	todayIso,
	weekDays,
} from '@/lib/date';
import { formatDuration } from '@/lib/duration';
import { cn } from '@/lib/utils';
import type { WeekTotals } from '../useWeekTotals';

interface WeekStripProps {
	/** The selected day; the strip shows the Monday-to-Sunday week it falls in. */
	date: string;
	weekTotals: WeekTotals | undefined;
	isPending: boolean;
	/** The week could not be read. Cells show no total rather than a zero they cannot stand behind. */
	isError?: boolean;
	today?: string;
}

/**
 * How a cell reads when nothing is logged on it (UI-5).
 *
 * `0h` is a gap - work was expected on this day and none of it is here - and an em dash means
 * there was nothing to expect. Which way round that is matters: this **reverses X-1**, where the
 * dash marked a past workday and `0h` covered weekends and the future. That made the two cells
 * that mean opposite things look identical on a Saturday, and it is the complaint UI-5 opens with.
 */
function formatCellTotal(minutes: number, isNonWorking: boolean): string {
	if (minutes > 0) return formatDuration(minutes);

	return isNonWorking ? '—' : '0h';
}

/**
 * What a cell is called when it is read out rather than looked at. The visible text is split
 * between a mobile and a desktop label and reads as "M 14 6h 15m" either way, which is not a name;
 * this is, and it lets both visible labels be hidden from assistive technology.
 *
 * The hatch and the dashed border say "non-working" to someone looking at the strip, so the name
 * has to say it too - a state drawn only in the fill is a state a screen reader cannot report
 * (guidebook 18).
 */
function describeCell(iso: string, minutes: number, isNonWorking: boolean, isError: boolean): string {
	if (isError) return `${formatDayShort(iso)}, total unavailable`;
	if (minutes > 0) return `${formatDayShort(iso)}, ${formatDuration(minutes)} logged`;

	return `${formatDayShort(iso)}, ${isNonWorking ? 'no work expected' : 'nothing logged'}`;
}

function CellSkeleton({ className }: { className?: string }) {
	return <div aria-hidden="true" className={cn('animate-pulse rounded-input bg-subtle', className)} />;
}

/**
 * The week around the selected day, with what was logged on each (SPEC 10, X-1).
 *
 * Scrolls horizontally on mobile as fixed 56px cells and lays out as an eight-column grid on
 * desktop, the eighth being the week's own total. Totals are hidden while loading rather than
 * showing stale numbers.
 */
export function WeekStrip({ date, weekTotals, isPending, isError = false, today = todayIso() }: WeekStripProps) {
	const days = weekDays(date);
	const weekTotal = days.reduce((sum, day) => sum + (weekTotals?.[day] ?? 0), 0);
	const stripRef = useRef<HTMLElement>(null);
	const selectedRef = useRef<HTMLAnchorElement>(null);

	/**
	 * Bring the selected day into view (design brief 3.2: "with the selected cell centered").
	 *
	 * Seven 56px cells plus the week's own come to roughly 460px, which does not fit a 390px screen,
	 * and the row always starts at Monday - so choosing a Friday scrolls the cell that was just
	 * chosen off the edge, and the strip then shows a week with no visible selection in it.
	 *
	 * Conditioned on the row actually overflowing rather than on a breakpoint: the desktop grid never
	 * does, so one check covers both widths and everything between them. `block: 'nearest'` keeps it
	 * to the horizontal axis - without it the page itself scrolls to put the strip in view on load.
	 *
	 * `isPending` is a dependency because the skeleton branch below renders no cells at all: the refs
	 * are attached on the render after the week lands, and the date has not changed by then.
	 */
	useEffect(() => {
		const strip = stripRef.current;
		const selected = selectedRef.current;
		if (strip === null || selected === null) return;
		if (strip.scrollWidth <= strip.clientWidth) return;

		selected.scrollIntoView({ block: 'nearest', inline: 'center' });
	}, [date, isPending]);

	if (isPending) {
		return (
			<div className="flex gap-2 overflow-hidden md:grid md:grid-cols-8 md:gap-3">
				{days.map((day) => (
					<CellSkeleton key={day} className="h-[68px] w-14 flex-none md:h-22 md:w-auto" />
				))}
				<CellSkeleton className="h-[68px] w-[98px] flex-none md:h-22 md:w-auto" />
			</div>
		);
	}

	return (
		// `scrollbar-none` rather than a visible bar: the strip is one row of tap targets, and the
		// effect above is what puts the selected cell in front of you rather than leaving it to be
		// hunted for.
		<nav
			ref={stripRef}
			aria-label="Week"
			className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:gap-2 md:overflow-visible md:px-0"
		>
			{days.map((day) => {
				const isSelected = day === date;
				const minutes = weekTotals?.[day] ?? 0;
				// Weekend for now. UI-6 replaces this with the person's own `availabilities`, where a
				// zero is a non-working day - which catches a four-day week that a weekend test cannot.
				const isNonWorking = isWeekend(day);

				return (
					<Link
						key={day}
						ref={isSelected ? selectedRef : undefined}
						to="/day/$date"
						params={{ date: day }}
						aria-label={describeCell(day, minutes, isNonWorking, isError)}
						// `aria-current="page"` is set by the router itself on the active link, so
						// the selected cell is marked without this component tracking it.
						className={cn(
							'duration-ui relative flex h-[68px] w-14 flex-none flex-col items-center gap-[3px] overflow-hidden rounded-input border bg-surface pt-2 leading-[1.2] whitespace-nowrap transition-colors ease-ui hover:bg-subtle md:h-22 md:w-auto md:items-start md:gap-1.5 md:px-2 md:pt-3',
							isNonWorking ? 'border-dashed border-line hatched' : 'border-line',
							// The token's own name for itself is "selected day" - the strip had been
							// carrying the whole selection on a 3px underline, which is the one thing
							// on a cell that a neighbouring cell's border can be mistaken for.
							isSelected && 'border-selection bg-selection hover:bg-selection'
						)}
					>
						<span
							aria-hidden="true"
							className={cn('text-micro font-medium md:hidden', isSelected ? 'text-accent-dark' : 'text-muted')}
						>
							{formatWeekdayInitial(day)}
						</span>
						<span
							aria-hidden="true"
							className={cn('hidden text-caption font-medium md:block', isSelected ? 'text-accent-dark' : 'text-muted')}
						>
							{formatWeekdayAndDay(day)}
						</span>
						<span
							aria-hidden="true"
							className={cn(
								'text-list font-medium tabular-nums md:hidden',
								isNonWorking && !isSelected && 'text-muted'
							)}
						>
							{dayOfMonth(day)}
						</span>
						<span
							aria-hidden="true"
							className="text-micro font-medium text-muted tabular-nums md:text-list md:text-ink"
						>
							{isError ? '·' : formatCellTotal(minutes, isNonWorking)}
						</span>

						{day === today && (
							<span className="absolute top-1.5 right-1.5 size-[5px] rounded-pill bg-accent md:top-3 md:right-3 md:size-1.5" />
						)}
						{isSelected && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />}
					</Link>
				);
			})}

			{/*
			 * A panel, not a card (UI-5): no border, no hover, no href and no tab stop, because it is
			 * the only thing in this row that is not a day and cannot be navigated to. The equals sign
			 * is what says "this is the sum of those" without a word for it.
			 */}
			<div className="flex h-[68px] w-[98px] flex-none flex-col items-center justify-center gap-0.5 rounded-input bg-selection px-2 md:h-22 md:w-auto">
				<span className="text-duration font-bold text-accent-dark tabular-nums">
					{isError ? <span aria-label="Week total unavailable">·</span> : `= ${formatDuration(weekTotal)}`}
				</span>
				<span className="text-micro font-medium whitespace-nowrap text-accent-dark opacity-70">Weekly total</span>
			</div>
		</nav>
	);
}

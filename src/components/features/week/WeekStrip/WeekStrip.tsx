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
 * How a cell reads when nothing is logged on it (design brief 3.2, X-1): a past workday shows a
 * muted dash because the absence is worth noticing, while a weekend or a day that has not happened
 * yet shows `0h`, because there is nothing to notice.
 */
function formatCellTotal(iso: string, minutes: number, today: string): string {
	if (minutes > 0) return formatDuration(minutes);
	// `>=`, so today is not called out for being empty at nine in the morning. SPEC 10's dash is
	// for a *past* workday, which today is not yet.
	if (iso >= today || isWeekend(iso)) return '0h';

	return '—';
}

/**
 * What a cell is called when it is read out rather than looked at. The visible text is split
 * between a mobile and a desktop label and reads as "M 14 6h 15m" either way, which is not a name;
 * this is, and it lets both visible labels be hidden from assistive technology.
 */
function describeCell(iso: string, minutes: number, isError: boolean): string {
	if (isError) return `${formatDayShort(iso)}, total unavailable`;

	return `${formatDayShort(iso)}, ${minutes > 0 ? `${formatDuration(minutes)} logged` : 'nothing logged'}`;
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
				<CellSkeleton className="h-[68px] w-[78px] flex-none md:h-22 md:w-auto" />
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
			className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:gap-3 md:overflow-visible md:px-0"
		>
			{days.map((day) => {
				const isSelected = day === date;
				const minutes = weekTotals?.[day] ?? 0;

				return (
					<Link
						key={day}
						ref={isSelected ? selectedRef : undefined}
						to="/day/$date"
						params={{ date: day }}
						aria-label={describeCell(day, minutes, isError)}
						// `aria-current="page"` is set by the router itself on the active link, so
						// the selected cell is marked without this component tracking it.
						className="duration-ui relative flex h-[68px] w-14 flex-none flex-col items-center gap-[3px] overflow-hidden rounded-input border border-line bg-surface pt-2 transition-colors ease-ui hover:bg-subtle md:h-22 md:w-auto md:items-start md:gap-1.5 md:px-3.5 md:pt-3"
					>
						<span aria-hidden="true" className="text-micro font-medium text-muted md:hidden">
							{formatWeekdayInitial(day)}
						</span>
						<span aria-hidden="true" className="hidden text-caption font-medium text-muted md:block">
							{formatWeekdayAndDay(day)}
						</span>
						<span aria-hidden="true" className="text-list font-medium tabular-nums md:hidden">
							{dayOfMonth(day)}
						</span>
						<span
							aria-hidden="true"
							className="text-micro font-medium text-muted tabular-nums md:text-list md:text-ink"
						>
							{isError ? '·' : formatCellTotal(day, minutes, today)}
						</span>

						{day === today && (
							<span className="absolute top-1.5 right-1.5 size-[5px] rounded-pill bg-accent md:top-3 md:right-3 md:size-1.5" />
						)}
						{isSelected && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-accent" />}
					</Link>
				);
			})}

			{/* Tinted on mobile to set it apart in a scrolling row; on desktop the grid already does that. */}
			<div className="flex h-[68px] w-[78px] flex-none flex-col items-start justify-center gap-1 rounded-input border border-line bg-subtle px-2 md:h-22 md:w-auto md:justify-start md:bg-surface md:px-3.5 md:pt-3">
				<span className="text-micro font-medium whitespace-nowrap text-muted md:text-caption">Week</span>
				<span className="text-list font-medium tabular-nums">
					{isError ? <span aria-label="Week total unavailable">·</span> : formatDuration(weekTotal)}
				</span>
			</div>
		</nav>
	);
}

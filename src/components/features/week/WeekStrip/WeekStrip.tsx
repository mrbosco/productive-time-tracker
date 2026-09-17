import { Link } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/core/Tooltip';
import { useHasHover } from '@/components/shared/useHasHover';
import { type AvailabilityPeriod, expectedMinutesOn } from '@/lib/availability';
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
	/**
	 * The person's working hours (UI-6). Empty until the membership query lands, and for an account
	 * that has never set any - in which case the strip says nothing about what was expected rather
	 * than claiming nothing was.
	 */
	availability?: AvailabilityPeriod[];
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
function describeCell(
	iso: string,
	minutes: number,
	isNonWorking: boolean,
	isError: boolean,
	expected: number | null
): string {
	if (isError) return `${formatDayShort(iso)}, total unavailable`;

	const logged =
		minutes > 0 ? `${formatDuration(minutes)} logged` : isNonWorking ? 'no work expected' : 'nothing logged';
	// The hover panel is a pointer convenience; the same numbers belong in the name, or a touch
	// screen and a screen reader never get them at all (guidebook 18).
	const against = expected === null || expected === 0 ? '' : ` of ${formatDuration(expected)} expected`;

	return `${formatDayShort(iso)}, ${logged}${against}`;
}

/**
 * The week's own total. Not a link and not focusable: there is no `/day/week` to go to, and UI-5's
 * whole point is that it should stop looking like an eighth day.
 */
function WeekTotalPanel({
	total,
	expected,
	isError,
	hasHover,
}: {
	total: number;
	expected: number | null;
	isError: boolean;
	hasHover: boolean;
}) {
	const name =
		expected === null || expected === 0
			? `Weekly total, ${formatDuration(total)}`
			: `Weekly total, ${formatDuration(total)} of ${formatDuration(expected)} expected`;

	const panel = (
		<div
			aria-label={isError ? 'Week total unavailable' : name}
			className="flex h-[68px] w-[98px] flex-none flex-col items-center justify-center gap-0.5 rounded-input bg-subtle/70 px-2 md:h-22 md:w-auto md:items-start md:px-4"
		>
			<span aria-hidden="true" className="text-duration font-semibold text-ink tabular-nums">
				{isError ? '·' : `= ${formatDuration(total)}`}
			</span>
			<span aria-hidden="true" className="text-micro font-medium whitespace-nowrap text-muted">
				Weekly total
			</span>
		</div>
	);

	if (!hasHover || expected === null || isError) return panel;

	return (
		<Tooltip>
			<TooltipTrigger asChild>{panel}</TooltipTrigger>
			<TooltipContent side="bottom" align="end" className="min-w-[232px]">
				<ExpectedRows expected={expected} worked={total} />
			</TooltipContent>
		</Tooltip>
	);
}

/** Expected, worked, and what is left of the first after the second (UI-6). */
function ExpectedRows({ expected, worked }: { expected: number; worked: number }) {
	const rows = [
		{ label: 'Expected work time', value: expected },
		{ label: 'Worked time', value: worked },
		// Clamped: an overrun is not negative hours left, it is none.
		{ label: 'Work hours left', value: Math.max(0, expected - worked) },
	];

	return (
		<dl className="flex flex-col gap-1.5">
			{rows.map((row) => (
				<div key={row.label} className="flex items-baseline gap-3.5">
					<dt className="flex-1 text-label text-on-accent/60">{row.label}</dt>
					<dd className="text-label font-bold tabular-nums">{formatDuration(row.value)}</dd>
				</div>
			))}
		</dl>
	);
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
export function WeekStrip({
	date,
	weekTotals,
	isPending,
	isError = false,
	today = todayIso(),
	availability = [],
}: WeekStripProps) {
	const days = weekDays(date);
	const weekTotal = days.reduce((sum, day) => sum + (weekTotals?.[day] ?? 0), 0);
	const expectedOn = (day: string) => expectedMinutesOn(availability, day);
	const weekExpected = days.reduce<number | null>((sum, day) => {
		const expected = expectedOn(day);

		return expected === null ? sum : (sum ?? 0) + expected;
	}, null);
	const hasHover = useHasHover();
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
			<div className="flex gap-2 overflow-hidden md:grid md:grid-cols-8 md:gap-1 md:rounded-entry md:border md:border-line md:bg-surface md:p-1.5">
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
			className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:gap-1 md:overflow-visible md:rounded-entry md:border md:border-line md:bg-surface md:p-1.5"
		>
			{days.map((day) => {
				const isSelected = day === date;
				const minutes = weekTotals?.[day] ?? 0;
				const expected = expectedOn(day);
				// The person's own working hours where they are known (UI-6), which catches a
				// four-day week that a weekend test cannot. The weekend is the fallback for an
				// account that has never set any.
				const isNonWorking = expected === null ? isWeekend(day) : expected === 0;

				const cell = (
					<Link
						key={day}
						ref={isSelected ? selectedRef : undefined}
						to="/day/$date"
						params={{ date: day }}
						aria-label={describeCell(day, minutes, isNonWorking, isError, expected)}
						// `aria-current="page"` is set by the router itself on the active link, so
						// the selected cell is marked without this component tracking it.
						className={cn(
							'duration-ui relative flex h-[68px] w-14 flex-none flex-col items-center gap-[3px] overflow-hidden rounded-input border bg-surface pt-2 leading-[1.2] whitespace-nowrap transition-colors ease-ui hover:bg-subtle md:h-22 md:w-auto md:items-start md:gap-2 md:px-4 md:pt-4',
							isNonWorking
								? 'border-dashed border-line hatched md:border-transparent'
								: 'border-line md:border-transparent',
							// The token's own name for itself is "selected day" - the strip had been
							// carrying the whole selection on a 3px underline, which is the one thing
							// on a cell that a neighbouring cell's border can be mistaken for.
							isSelected && 'border-accent/25 bg-selection hover:bg-selection md:border-accent/25'
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
						{isSelected && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-pill bg-accent" />}
					</Link>
				);

				/*
				 * The panel is a pointer affordance and nothing more: a cell is a link, so on a
				 * touch screen its one gesture is already spoken for by navigating to that day.
				 * What it would have said is in the cell's accessible name either way.
				 */
				if (!hasHover || expected === null || isError) return cell;

				return (
					<Tooltip key={day}>
						<TooltipTrigger asChild>{cell}</TooltipTrigger>
						<TooltipContent side="bottom" className="min-w-[232px]">
							<ExpectedRows expected={expected} worked={minutes} />
						</TooltipContent>
					</Tooltip>
				);
			})}

			{/*
			 * A panel, not a card (UI-5): no border, no hover, no href and no tab stop, because it is
			 * the only thing in this row that is not a day and cannot be navigated to. The equals sign
			 * is what says "this is the sum of those" without a word for it.
			 *
			 * UI-6's numbers reach it by hover and by name, never by focus - giving it a tab stop to
			 * make the panel keyboard-reachable is the thing UI-5 took away.
			 */}
			<WeekTotalPanel total={weekTotal} expected={weekExpected} isError={isError} hasHover={hasHover} />
		</nav>
	);
}

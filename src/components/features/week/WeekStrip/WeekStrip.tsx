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
	date: string;
	weekTotals: WeekTotals | undefined;
	isPending: boolean;
	isError?: boolean;
	today?: string;
	/** The person's working hours. Empty until the membership query lands, and for an account that
	 * never set any - in which case the strip says nothing about what was expected. */
	availability?: AvailabilityPeriod[];
}

/** `0h` is a gap - work was expected and none is here - and an em dash means none was expected. */
function formatCellTotal(minutes: number, isNonWorking: boolean): string {
	if (minutes > 0) return formatDuration(minutes);

	return isNonWorking ? '—' : '0h';
}

/** What a cell is called when read out. The visible text is split between a mobile and a desktop
 * label, so neither works alone, and the hatch that means "non-working" has to be spoken. */
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
	const against = expected === null || expected === 0 ? '' : ` of ${formatDuration(expected)} expected`;

	return `${formatDayShort(iso)}, ${logged}${against}`;
}

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
			className="flex h-[92px] w-[108px] flex-none flex-col items-center justify-center gap-0.5 rounded-input bg-selection/65 px-2 md:h-[124px] md:w-auto md:items-start md:px-4"
		>
			<span aria-hidden="true" className="text-title font-semibold tracking-tight text-accent-dark tabular-nums">
				{isError ? '·' : formatDuration(total)}
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

function ExpectedRows({ expected, worked }: { expected: number; worked: number }) {
	const rows = [
		{ label: 'Expected work time', value: expected },
		{ label: 'Worked time', value: worked },
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

/** The week around the selected day: a scrolling row of 56px cells on mobile, an eight-column grid
 * on desktop whose eighth column is the week's total. */
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

	/** Bring the selected day into view. `block: 'nearest'` keeps it to the horizontal axis, or the
	 * page scrolls to put the strip in view on load; `isPending` because the skeleton holds no refs. */
	useEffect(() => {
		const strip = stripRef.current;
		const selected = selectedRef.current;
		if (strip === null || selected === null) return;
		if (strip.scrollWidth <= strip.clientWidth) return;

		selected.scrollIntoView({ block: 'nearest', inline: 'center' });
	}, [date, isPending]);

	if (isPending) {
		return (
			<div className="flex gap-2 overflow-hidden md:grid md:grid-cols-8 md:gap-1 md:rounded-entry md:border md:border-line md:bg-surface md:p-2">
				{days.map((day) => (
					<CellSkeleton key={day} className="h-[92px] w-16 flex-none md:h-[124px] md:w-auto" />
				))}
				<CellSkeleton className="h-[92px] w-[108px] flex-none md:h-[124px] md:w-auto" />
			</div>
		);
	}

	return (
		<nav
			ref={stripRef}
			aria-label="Week"
			className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-8 md:gap-1 md:overflow-visible md:rounded-entry md:border md:border-line md:bg-surface md:p-2"
		>
			{days.map((day) => {
				const isSelected = day === date;
				const minutes = weekTotals?.[day] ?? 0;
				const expected = expectedOn(day);
				// The person's own working hours where they are known, which catches a four-day week that a
				// weekend test cannot. The weekend is the fallback for an account that has never set any.
				const isNonWorking = expected === null ? isWeekend(day) : expected === 0;

				const cell = (
					<Link
						key={day}
						ref={isSelected ? selectedRef : undefined}
						to="/day/$date"
						params={{ date: day }}
						aria-label={describeCell(day, minutes, isNonWorking, isError, expected)}
						className={cn(
							'duration-ui relative flex h-[92px] w-16 flex-none flex-col items-center gap-1 overflow-hidden rounded-input border bg-surface pt-2.5 leading-[1.2] whitespace-nowrap transition-colors ease-ui hover:bg-subtle md:h-[124px] md:w-auto md:items-start md:gap-2 md:px-4 md:pt-3',
							isNonWorking
								? 'border-dashed border-line hatched md:border-transparent'
								: 'border-line md:border-transparent',
							isSelected && 'border-accent bg-accent text-white shadow-fab hover:bg-accent md:border-accent'
						)}
					>
						<span
							aria-hidden="true"
							className={cn('text-micro font-medium md:hidden', isSelected ? 'text-white/80' : 'text-muted')}
						>
							{formatWeekdayInitial(day)}
						</span>
						<span
							aria-hidden="true"
							className={cn('hidden text-caption font-medium md:block', isSelected ? 'text-white/80' : 'text-muted')}
						>
							{formatWeekdayAndDay(day).split(' ')[0]}
						</span>
						<span
							aria-hidden="true"
							className={cn(
								'text-title font-semibold tracking-tight tabular-nums md:text-[28px]',
								isNonWorking && !isSelected && 'text-muted'
							)}
						>
							{dayOfMonth(day)}
						</span>
						<span
							aria-hidden="true"
							className={cn(
								'text-micro font-medium tabular-nums md:text-caption',
								isSelected ? 'text-white/80' : 'text-muted'
							)}
						>
							{isError ? '·' : formatCellTotal(minutes, isNonWorking)}
						</span>

						{day === today && (
							<span
								className={cn(
									'absolute top-1.5 right-1.5 size-[5px] rounded-pill md:top-3 md:right-3 md:size-1.5',
									isSelected ? 'bg-white' : 'bg-accent'
								)}
							/>
						)}
						{!isError && expected !== null && expected > 0 && (
							<span
								aria-hidden="true"
								className={cn(
									'absolute inset-x-4 bottom-3 hidden h-[3px] overflow-hidden rounded-pill md:block',
									isSelected ? 'bg-white/20' : 'bg-subtle'
								)}
							>
								<span
									className={cn(
										'block h-full rounded-pill transition-[width] duration-500',
										isSelected ? 'bg-white' : 'bg-accent/60'
									)}
									style={{ width: `${Math.min(100, (minutes / expected) * 100)}%` }}
								/>
							</span>
						)}
					</Link>
				);

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

			<WeekTotalPanel total={weekTotal} expected={weekExpected} isError={isError} hasHover={hasHover} />
		</nav>
	);
}

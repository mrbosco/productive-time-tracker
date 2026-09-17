import { CalendarDays, LayoutList } from 'lucide-react';
import { Link, useRouterState } from '@tanstack/react-router';
import { startOfWeek } from '@/lib/date';
import { cn } from '@/lib/utils';

/**
 * Day or Timesheet, in the app bar (UI-7).
 *
 * Two items, so a segmented control rather than tabs or a dropdown. It is a route change and not a
 * filter, and it carries the date across: switching from Tue 15 lands on the week containing Tue 15,
 * and switching back returns to Tue 15 rather than to today.
 *
 * Hidden below `md` rather than disabled-and-explained in the bar: the design disables it under
 * 900px, and the timesheet route says the same thing in full when somebody arrives there anyway -
 * which is the only way they can, since nothing here offers it.
 */
export function ViewSwitch({ date }: { date: string }) {
	const isWeek = useRouterState({ select: (state) => state.location.pathname.startsWith('/week/') });
	const item =
		'duration-ui flex h-10 items-center gap-2 rounded-input px-4 text-label font-medium transition-colors ease-ui';

	return (
		<div className="hidden rounded-control bg-canvas p-1 md:flex md:gap-0.5">
			<Link
				to="/day/$date"
				params={{ date }}
				className={cn(item, isWeek ? 'text-muted hover:text-ink' : 'bg-surface text-accent-dark shadow-control')}
			>
				<LayoutList size={16} aria-hidden="true" />
				Day
			</Link>
			<Link
				to="/week/$date"
				params={{ date: startOfWeek(date) }}
				className={cn(item, isWeek ? 'bg-surface text-accent-dark shadow-control' : 'text-muted hover:text-ink')}
			>
				<CalendarDays size={16} aria-hidden="true" />
				Timesheet
			</Link>
		</div>
	);
}

import { useQuery } from '@tanstack/react-query';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { lazy, type ReactNode, Suspense, useState } from 'react';
import { findMembershipForOrganization } from '@/api/organization-memberships';
import logoUrl from '@/assets/logo-productive.svg';
import { Avatar } from '@/components/core/Avatar';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { sessionQueryOptions, useLogout } from '@/components/features/auth/useSession';
import { SettingsSheet } from '@/components/features/settings/SettingsSheet/SettingsSheet';
import { TimerControl } from '@/components/features/timer/TimerControl/TimerControl';
import { TimerProvider, useTimerContext } from '@/components/features/timer/TimerProvider';
import { ShortcutsSheet } from '@/components/shared/ShortcutsSheet/ShortcutsSheet';
import { ViewSwitch } from '@/components/features/week/ViewSwitch/ViewSwitch';
import { useHotkeys } from '@/components/shared/useHotkeys';
import { isIsoDate, startOfWeek, todayIso } from '@/lib/date';
import type { Session } from '@/lib/storage';

/** Loaded when a timer stops, never before. The sheet writes rich text, so a static import would put
 * TipTap - 404 kB raw, ADR-0010's measured cost - on the critical path of every authenticated route. */
const StopTimerSheet = lazy(async () => ({
	default: (await import('@/components/features/timer/StopTimerSheet/StopTimerSheet')).StopTimerSheet,
}));

function CaretIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className="text-muted">
			<path d="M4 8.2h12L10 15 4 8.2Z" fill="currentColor" />
		</svg>
	);
}

/** The chrome every authenticated screen sits in: the product mark and name, the timer control, and
 * the avatar menu that holds logout. The provider is mounted out here so the timer is shared with
 * what `children` renders - a card's `Continue timer` is the second consumer. */
export function AppLayout({ session, children }: { session: Session; children: ReactNode }) {
	return (
		<TimerProvider session={session}>
			<AppChrome session={session}>{children}</AppChrome>
		</TimerProvider>
	);
}

/** The bar itself. The email comes from the membership the session was already re-validated against,
 * so it costs no extra request and no extra session field. */
function AppChrome({ session, children }: { session: Session; children: ReactNode }) {
	const logout = useLogout();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
	const { data: memberships } = useQuery(sessionQueryOptions(session));
	const timer = useTimerContext();
	const navigate = useNavigate();
	/* The date the switch carries across, read off whichever route is showing. A week route names
	 * its Monday, which is a real day, so switching back lands somewhere sensible. */
	const viewDate = useRouterState({
		select: (state) => {
			const [, , date] = state.location.pathname.split('/');

			return date !== undefined && isIsoDate(date) ? date : todayIso();
		},
	});
	/* Keyed on the organization rather than the person: a token with memberships in two organizations
	 * has a different person record in each, and the organization is what was chosen at login. */
	const membership = findMembershipForOrganization(memberships ?? [], session.organizationId);
	const email = membership?.person?.email ?? null;
	const personAvatarUrl = membership?.person?.avatarUrl ?? null;
	const organizationName = membership?.organizationName ?? null;
	const organizationAvatarUrl = membership?.organizationAvatarUrl ?? null;

	/* Registered here rather than on the day view: these act on chrome that is on every authenticated
	 * route. The shortcuts that act on the day's list belong to the screen that has one. */
	useHotkeys({
		'?': () => {
			setIsShortcutsOpen(true);
		},
		// The day/week switch. Here rather than on either screen: the point of it is the other one.
		w: () => {
			void navigate({ to: '/week/$date', params: { date: startOfWeek(viewDate) } });
		},
		d: () => {
			void navigate({ to: '/day/$date', params: { date: viewDate } });
		},
		// The bar carries the timer on every route, so the key that stops it has to work on every one.
		s: () => {
			if (timer.running !== null) timer.stop();
		},
	});

	return (
		<div className="min-h-dvh">
			<header className="flex h-14 items-center gap-2 border-b border-line bg-surface pr-2 pl-4 md:h-20 md:gap-4 md:px-8 xl:px-[max(48px,calc((100%-1280px)/2))]">
				<img src={logoUrl} alt="Productive" className="hidden h-6 md:block" />
				<span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line md:block" />
				<ViewSwitch date={viewDate} />
				<span className="flex-1 text-list font-medium tracking-[-.01em] md:hidden">Time Tracker</span>
				<span className="hidden flex-1 md:block" />

				<TimerControl
					running={timer.running}
					justStarted={timer.justStarted}
					isBusy={timer.isBusy}
					onStart={() => {
						timer.start();
					}}
					onStop={timer.stop}
				/>

				<button
					type="button"
					aria-label="Keyboard shortcuts"
					onClick={() => {
						setIsShortcutsOpen(true);
					}}
					className="duration-ui hidden size-10 flex-none place-items-center rounded-control text-meta font-medium text-muted transition-colors ease-ui hover:bg-subtle hover:text-ink md:grid"
				>
					?
				</button>

				<DropdownMenu>
					<DropdownMenuTrigger
						aria-label="Account menu"
						className="flex h-11 flex-none items-center gap-2 rounded-control px-1 md:h-12 md:pl-3"
					>
						<span className="relative size-10 flex-none">
							<Avatar
								name={session.personName}
								src={personAvatarUrl}
								className="size-10 rounded-pill"
								fallbackClassName="bg-selection text-caption font-medium text-accent-dark"
							/>
							{organizationName !== null && (
								<Avatar
									name={organizationName}
									src={organizationAvatarUrl}
									className="absolute -right-[3px] -bottom-[3px] size-[18px] rounded-[6px] border-2 border-surface"
									fallbackClassName="bg-accent-dark text-[8px] font-bold text-on-accent"
								/>
							)}
						</span>
						<span className="hidden max-w-36 truncate text-label font-medium xl:block">{session.personName}</span>
						<span className="hidden md:block">
							<CaretIcon />
						</span>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-[246px]">
						<div className="flex items-center gap-2.5 px-3 pt-2.5 pb-3">
							<Avatar
								name={session.personName}
								src={personAvatarUrl}
								className="size-9 flex-none rounded-[10px]"
								fallbackClassName="bg-selection text-caption font-medium text-accent-dark"
							/>
							<div className="min-w-0">
								<p className="truncate text-meta font-medium">{session.personName}</p>
								{email !== null && <p className="mt-[3px] truncate text-caption text-muted">{email}</p>}
							</div>
						</div>
						<DropdownMenuSeparator />
						<div className="flex items-center gap-2.5 px-3 py-2">
							{organizationName !== null && (
								<Avatar
									name={organizationName}
									src={organizationAvatarUrl}
									className="size-6 flex-none rounded-[6px]"
									fallbackClassName="bg-accent-dark text-[9px] font-bold text-on-accent"
								/>
							)}
							<span className="truncate text-label font-medium">
								{organizationName === null
									? `Organization ${session.organizationId}`
									: `${organizationName} · org ${session.organizationId}`}
							</span>
						</div>
						{/* The service every new entry and timer is logged against. */}
						<DropdownMenuItem
							onSelect={() => {
								setIsSettingsOpen(true);
							}}
						>
							Default service...
						</DropdownMenuItem>
						<DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>

			{children}

			{/* Also opened by the timer when there is no default service to start one on, and by a save
			     Productive refuses for the service - this sheet is the only place either is fixed. */}
			<SettingsSheet
				session={session}
				open={isSettingsOpen || timer.needsService}
				onOpenChange={(next) => {
					setIsSettingsOpen(next);
					if (!next) timer.dismissNeedsService();
				}}
			/>
			<ShortcutsSheet open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
			{timer.stopped !== null && (
				<Suspense>
					<StopTimerSheet session={session} stopped={timer.stopped} onClose={timer.dismissStopped} />
				</Suspense>
			)}
		</div>
	);
}

import { useQuery } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import logoUrl from '@/assets/logo-productive.svg';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { sessionQueryOptions, useLogout } from '@/components/features/auth/useSession';
import { SettingsSheet } from '@/components/features/settings/SettingsSheet/SettingsSheet';
import { StopTimerSheet } from '@/components/features/timer/StopTimerSheet/StopTimerSheet';
import { TimerControl } from '@/components/features/timer/TimerControl/TimerControl';
import { TimerProvider, useTimerContext } from '@/components/features/timer/TimerProvider';
import { ShortcutsSheet } from '@/components/shared/ShortcutsSheet/ShortcutsSheet';
import { useHotkeys } from '@/components/shared/useHotkeys';
import type { Session } from '@/lib/storage';

/** "Ada Lovelace" -> "AL". One letter when there is only one word, empty when the name is. */
export function toInitials(name: string): string {
	const words = name.split(' ').filter(Boolean);

	return [words.at(0), words.length > 1 ? words.at(-1) : undefined]
		.filter((word) => word !== undefined)
		.map((word) => word.charAt(0).toUpperCase())
		.join('');
}

function CaretIcon() {
	return (
		<svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true" className="text-muted">
			<path d="M4 8.2h12L10 15 4 8.2Z" fill="currentColor" />
		</svg>
	);
}

/**
 * The chrome every authenticated screen sits in: the product mark and name, the timer control,
 * and the avatar menu that holds logout (R-2).
 *
 * The provider is mounted out here and the chrome consumes it, so the timer is shared with what
 * `children` renders - a card's `Continue timer` is the second consumer, down inside the day.
 */
export function AppLayout({ session, children }: { session: Session; children: ReactNode }) {
	return (
		<TimerProvider session={session}>
			<AppChrome session={session}>{children}</AppChrome>
		</TimerProvider>
	);
}

/**
 * The bar itself.
 *
 * The email comes from the membership the session was already re-validated against, so the menu
 * reads the way the design draws it without the session having to carry another field.
 */
function AppChrome({ session, children }: { session: Session; children: ReactNode }) {
	const logout = useLogout();
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
	const { data: memberships } = useQuery(sessionQueryOptions(session));
	const timer = useTimerContext();
	const email = memberships?.find((membership) => membership.personId === session.personId)?.person?.email ?? null;
	const initials = toInitials(session.personName);

	/*
	 * Registered here rather than on the day view because the sheet is reachable from every
	 * authenticated route, which is where the button that opens it lives. Everything else X-2
	 * binds acts on the day's list, and belongs to the screen that has one.
	 */
	useHotkeys({
		'?': () => {
			setIsShortcutsOpen(true);
		},
		// X-4's, and global for the same reason: the bar carries the timer on every route, so the
		// key that stops it has to work on every route too.
		s: () => {
			if (timer.running !== null) timer.stop();
		},
	});

	return (
		<div className="min-h-dvh">
			<header className="flex h-14 items-center gap-2 border-b border-line bg-surface pr-2 pl-4 md:h-16 md:gap-3 md:px-12">
				<img src={logoUrl} alt="Productive" className="hidden h-6 md:block" />
				<span aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line md:block" />
				<span className="flex-1 text-list font-medium tracking-[-.01em]">Time Tracker</span>

				<TimerControl
					running={timer.running}
					justStarted={timer.justStarted}
					isBusy={timer.isBusy}
					onStart={() => {
						timer.start();
					}}
					onStop={timer.stop}
				/>

				{/*
				 * Desktop only, as the design has it - a phone has no keyboard to teach. The `?` key
				 * opens the same sheet at every width, which costs nothing and is the only way in on a
				 * narrow window with a keyboard attached.
				 */}
				<button
					type="button"
					aria-label="Keyboard shortcuts"
					onClick={() => {
						setIsShortcutsOpen(true);
					}}
					className="duration-ui hidden size-10 flex-none place-items-center rounded-pill border border-line bg-surface text-meta font-medium text-muted transition-colors ease-ui hover:bg-subtle md:grid"
				>
					?
				</button>

				<DropdownMenu>
					<DropdownMenuTrigger
						// The initials are decoration over the name in the menu, so the button
						// gets the accessible name instead of leaving a screen reader to read
						// out two letters.
						aria-label="Account menu"
						className="flex h-11 flex-none items-center gap-2 rounded-pill px-1 md:h-10"
					>
						<span className="grid size-8 place-items-center rounded-pill bg-selection text-caption font-medium text-accent-dark">
							{initials}
						</span>
						<span className="hidden md:block">
							<CaretIcon />
						</span>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end" className="w-[246px]">
						<div className="px-3 pt-2.5 pb-3">
							<p className="text-meta font-medium">{session.personName}</p>
							{email !== null && <p className="mt-[3px] text-caption text-muted">{email}</p>}
						</div>
						<DropdownMenuSeparator />
						{/* A-1: the service every new entry and timer is logged against. */}
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

			{/*
			 * Also opened by the timer when there is no default service to start one on, which is
			 * the only place that can be fixed - the same route A-1b takes when Productive refuses
			 * the service an entry was logged against.
			 */}
			<SettingsSheet
				session={session}
				open={isSettingsOpen || timer.needsService}
				onOpenChange={(next) => {
					setIsSettingsOpen(next);
					if (!next) timer.dismissNeedsService();
				}}
			/>
			<ShortcutsSheet open={isShortcutsOpen} onOpenChange={setIsShortcutsOpen} />
			<StopTimerSheet session={session} stopped={timer.stopped} onClose={timer.dismissStopped} />
		</div>
	);
}

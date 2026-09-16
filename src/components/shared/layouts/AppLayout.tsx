import type { ReactNode } from 'react';
import { Button } from '@/components/core/Button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/core/DropdownMenu';
import { useLogout } from '@/components/features/auth/useSession';
import type { Session } from '@/lib/storage';

/** "Ada Lovelace" -> "AL". One letter when there is only one word, empty when the name is. */
export function toInitials(name: string): string {
	const words = name.split(' ').filter(Boolean);

	return [words.at(0), words.length > 1 ? words.at(-1) : undefined]
		.filter((word) => word !== undefined)
		.map((word) => word.charAt(0).toUpperCase())
		.join('');
}

/**
 * The chrome every authenticated screen sits in: app name, and the avatar menu that holds logout
 * (R-2). `Default service...` joins it with the Settings sheet, and the timer control with X-4.
 */
export function AppLayout({ session, children }: { session: Session; children: ReactNode }) {
	const logout = useLogout();
	const initials = toInitials(session.personName);

	return (
		<div className="min-h-dvh">
			<header className="flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:h-16 md:px-12">
				<span className="text-base font-semibold">Time Tracker</span>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							// The initials are decoration over the name in the menu, so the button
							// gets the accessible name instead of leaving a screen reader to read
							// out two letters.
							aria-label="Account menu"
							className="rounded-pill bg-selection text-label font-semibold text-accent-dark hover:bg-selection"
						>
							{initials}
						</Button>
					</DropdownMenuTrigger>

					<DropdownMenuContent align="end">
						<DropdownMenuLabel>{session.personName}</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onSelect={logout}>Log out</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</header>

			{children}
		</div>
	);
}

import { Sheet, SheetContent, SheetTitle } from '@/components/core/Sheet';

/**
 * The rows of `05-global-shortcuts.png`, in the order it draws them.
 *
 * The two directional rows carry both arrows in one cap, as the design draws them: `← →` is one
 * shortcut with two directions, and four rows would say there are four things to learn.
 *
 * `s` (stop timer) is not here yet: X-4 is what gives it something to stop, and a sheet that
 * teaches a key which does nothing is worse than one that is short. It joins this list there.
 */
const SHORTCUTS: { keys: string; action: string }[] = [
	{ keys: 'n', action: 'New entry' },
	{ keys: '← →', action: 'Previous / next day' },
	{ keys: 't', action: 'Today' },
	{ keys: '↑ ↓', action: 'Move between entries' },
	{ keys: 'e', action: 'Edit focused entry' },
	{ keys: 'Del', action: 'Delete focused entry' },
	{ keys: '?', action: 'This sheet' },
	{ keys: 'Esc', action: 'Close' },
];

function CloseIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M5.6 4.2 10 8.6l4.4-4.4 1.4 1.4L11.4 10l4.4 4.4-1.4 1.4L10 11.4l-4.4 4.4-1.4-1.4L8.6 10 4.2 5.6 5.6 4.2Z"
				fill="currentColor"
			/>
		</svg>
	);
}

/**
 * What the keyboard can do, from the `?` button in the app bar and from the `?` key (SPEC 10, X-2).
 *
 * A `dl`, not a table: each row is a term and what it means, which is what a description list is
 * for, and it needs no column headers to be read out correctly.
 *
 * The sheet itself is why `Esc` needs no handler anywhere - Radix closes it, as it closes every
 * other dialog in the app, so the row documents behaviour that already exists rather than adding
 * a key. `useHotkeys` also stops the `?` key from reaching here while it is open, because focus is
 * inside a `role="dialog"`: the sheet cannot re-open itself on top of itself.
 */
export function ShortcutsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent aria-describedby={undefined}>
				<div className="mb-[18px] flex items-start justify-between gap-4 md:mb-5">
					<SheetTitle>Keyboard shortcuts</SheetTitle>
					<button
						type="button"
						aria-label="Close"
						onClick={() => {
							onOpenChange(false);
						}}
						className="duration-ui -mt-1.5 -mr-1.5 grid size-9 flex-none place-items-center rounded-pill text-muted transition-colors ease-ui hover:bg-subtle"
					>
						<CloseIcon />
					</button>
				</div>

				<dl className="flex flex-col">
					{SHORTCUTS.map(({ keys, action }) => (
						<div key={action} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
							<dt className="flex-none">
								<kbd className="grid h-7 min-w-11 place-items-center rounded-input bg-subtle px-2.5 font-mono text-caption font-medium">
									{keys}
								</kbd>
							</dt>
							<dd className="text-meta">{action}</dd>
						</div>
					))}
				</dl>
			</SheetContent>
		</Sheet>
	);
}

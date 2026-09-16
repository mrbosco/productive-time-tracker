import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/** The design's dismissal delay (`TimeTracker.dc.html`). */
const TOAST_DURATION_MS = 2600;

function CheckIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-success">
			<circle cx="10" cy="10" r="8" fill="currentColor" />
			<path d="M6 10.3l1.3-1.3 1.9 1.9 4-4L14.5 8.2l-5.3 5.3L6 10.3Z" fill="#fff" />
		</svg>
	);
}

interface ToastProps {
	children: string;
	onDismiss: () => void;
	durationMs?: number;
}

/**
 * The confirmation that a write landed: bottom-centre on mobile, bottom-right on desktop
 * (`05-global-toasts.png`).
 *
 * Presentational, and there is deliberately no provider or store behind it. Every toast in this
 * app is raised by the screen the user is standing on - the day view, after a create returns to it
 * or a delete completes in place - so the state is local, which is what SPEC 6.3 asks for.
 *
 * Only the success variant exists. The design's error toast is drawn, but its own build notes call
 * it redundant with the form's error banner and say to ship one: the banner, which stays on screen
 * and keeps the failed values beside it.
 *
 * `role="status"` rather than `alert`: this is confirmation of something the user just did, so it
 * is announced politely instead of interrupting.
 */
export function Toast({ children, onDismiss, durationMs = TOAST_DURATION_MS }: ToastProps) {
	/**
	 * The timer is keyed on the message and the delay, never on `onDismiss`.
	 *
	 * Callers pass an inline arrow - which is the readable thing to write - and a new one arrives
	 * on every parent render. Depending on it would clear and restart the countdown each time, so
	 * a toast on a screen that re-renders could hang around indefinitely. The handler is read from
	 * a ref instead, which is the referential stability guidebook 11 allows memoising for.
	 */
	const dismiss = useRef(onDismiss);

	useEffect(() => {
		dismiss.current = onDismiss;
	}, [onDismiss]);

	useEffect(() => {
		const timer = setTimeout(() => {
			dismiss.current();
		}, durationMs);

		return () => {
			clearTimeout(timer);
		};
	}, [durationMs, children]);

	return (
		<div
			role="status"
			className={cn(
				'pointer-events-none fixed inset-x-0 bottom-25 z-40 flex justify-center px-5',
				'md:inset-x-auto md:right-8 md:bottom-8 md:px-0'
			)}
		>
			<div className="flex animate-sheet-up items-center gap-2.5 rounded-input border border-line bg-surface px-4 py-3 shadow-menu">
				<CheckIcon />
				<span className="text-meta font-medium">{children}</span>
			</div>
		</div>
	);
}

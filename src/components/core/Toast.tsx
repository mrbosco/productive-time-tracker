import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/** The design's dismissal delay (`TimeTracker.dc.html`). */
const TOAST_DURATION_MS = 2600;

/**
 * Longer for a failure. A confirmation can go once it has been read - the thing it describes stays
 * on screen. A failure is the opposite: it reports something that did not happen, it is the only
 * report of it where there is no banner to carry one (SPEC 4.2), and the screen behind it looks
 * exactly as it did before the attempt.
 */
const ERROR_TOAST_DURATION_MS = 6000;

function CheckIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-success">
			<circle cx="10" cy="10" r="8" fill="currentColor" />
			<path d="M6 10.3l1.3-1.3 1.9 1.9 4-4L14.5 8.2l-5.3 5.3L6 10.3Z" fill="#fff" />
		</svg>
	);
}

function AlertIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true" className="flex-none text-danger">
			<circle cx="10" cy="10" r="8" fill="currentColor" />
			<path d="M9.1 5.2h1.8v6H9.1v-6Zm0 7.2h1.8v1.8H9.1v-1.8Z" fill="#fff" />
		</svg>
	);
}

interface ToastProps {
	children: string;
	onDismiss: () => void;
	durationMs?: number;
	variant?: 'success' | 'error';
}

/**
 * The confirmation that a write landed: bottom-centre on mobile, bottom-right on desktop
 * (`05-global-toasts.png`).
 *
 * Presentational, and there is deliberately no provider or store behind it. Every toast in this
 * app is raised by the screen the user is standing on - the day view, after a create returns to it
 * or a delete completes in place - so the state is local, which is what SPEC 6.3 asks for.
 *
 * Two variants, which is what the design's component sheet draws. The build notes preferred a
 * form's error banner to an error toast, and where there is a form that still holds - the entry
 * form reports its own failures inline, beside the values that failed. The day view has no banner:
 * a delete that fails there has nowhere else to be said, and SPEC 4.2 asks for it in as many words.
 *
 * `role="status"` for a success, because it confirms something the user just did and can be
 * announced politely. An error is `role="alert"`: it reports that what they asked for did not
 * happen, which is worth interrupting for.
 */
export function Toast({ children, onDismiss, durationMs, variant = 'success' }: ToastProps) {
	const delay = durationMs ?? (variant === 'error' ? ERROR_TOAST_DURATION_MS : TOAST_DURATION_MS);
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
		}, delay);

		return () => {
			clearTimeout(timer);
		};
	}, [delay, children]);

	return (
		<div
			role={variant === 'success' ? 'status' : 'alert'}
			className={cn(
				'pointer-events-none fixed inset-x-0 bottom-25 z-40 flex justify-center px-5',
				'md:inset-x-auto md:right-8 md:bottom-8 md:px-0'
			)}
		>
			<div className="flex animate-sheet-up items-center gap-2.5 rounded-input border border-line bg-surface px-4 py-3 shadow-menu">
				{variant === 'success' ? <CheckIcon /> : <AlertIcon />}
				<span className="text-meta font-medium">{children}</span>
			</div>
		</div>
	);
}

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const TOAST_DURATION_MS = 2600;

/** Longer for a failure: a confirmation can go once read, where a failure reports something that
 * did *not* happen and the screen behind looks unchanged. */
const ERROR_TOAST_DURATION_MS = 6000;

/** Longer again with an action: an Undo that leaves before it can be reached is just a
 * confirmation with a button on it. */
const ACTION_TOAST_DURATION_MS = 8000;

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
	action?: { label: string; onAction: () => void };
}

/** The confirmation that a write landed. No provider behind it - every toast is raised by the screen
 * the user is standing on. `role="alert"` for an error, `status` for a success. */
export function Toast({ children, onDismiss, durationMs, variant = 'success', action }: ToastProps) {
	const delay =
		durationMs ??
		(action !== undefined
			? ACTION_TOAST_DURATION_MS
			: variant === 'error'
				? ERROR_TOAST_DURATION_MS
				: TOAST_DURATION_MS);
	/** Keyed on the message and the delay, never on `onDismiss`: callers pass an inline arrow, and a
	 * new one each render would restart the countdown, so the toast could hang around forever. */
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
			<div
				className={cn(
					'flex animate-sheet-up items-center gap-2.5 rounded-input border border-line bg-surface px-4 py-3 shadow-menu',
					action !== undefined && 'pointer-events-auto'
				)}
			>
				{variant === 'success' ? <CheckIcon /> : <AlertIcon />}
				<span className="text-meta font-medium">{children}</span>
				{action !== undefined && (
					<button
						type="button"
						onClick={() => {
							action.onAction();
							onDismiss();
						}}
						className="duration-ui -my-1 ml-1.5 rounded-pill px-2.5 py-1 text-meta font-medium text-accent transition-colors ease-ui hover:bg-selection"
					>
						{action.label}
					</button>
				)}
			</div>
		</div>
	);
}

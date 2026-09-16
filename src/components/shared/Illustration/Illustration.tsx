/**
 * The isometric illustrations from the design system's illustration sheet. Decorative: each is
 * `aria-hidden` and always sits beside a sentence that carries the meaning, so nothing is lost
 * when they are not rendered (R-7: never an illustration alone).
 *
 * Inline rather than files in `assets/`: they are two-colour, gradient-filled and tiny, and an
 * `<img>` would cost a request each and could not inherit anything.
 */
function Gradients({ prefix }: { prefix: string }) {
	return (
		<defs>
			<linearGradient id={`${prefix}-top`} x1="0" y1="0" x2="1" y2="1">
				<stop stopColor="#FFFFFF" />
				<stop offset="1" stopColor="#EDE7FF" />
			</linearGradient>
			<linearGradient id={`${prefix}-side`} x1="0" y1="0" x2="0" y2="1">
				<stop stopColor="#C9B6FF" />
				<stop offset="1" stopColor="#A98CFF" />
			</linearGradient>
			<linearGradient id={`${prefix}-tile`} x1="0" y1="0" x2="1" y2="1">
				<stop stopColor="#F5F1FF" />
				<stop offset="1" stopColor="#DED2FF" />
			</linearGradient>
		</defs>
	);
}

/** A bare slab with one tile resting beside it: a day with nothing logged on it. */
export function EmptyDayIllustration() {
	return (
		<svg width="168" height="146" viewBox="0 0 300 260" fill="none" aria-hidden="true">
			<Gradients prefix="empty" />
			<g transform="matrix(.866,.5,-.866,.5,150,176)">
				<rect x="-70" y="-70" width="140" height="140" rx="24" fill="url(#empty-side)" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,150,140)">
				<rect x="-70" y="-70" width="140" height="140" rx="24" fill="url(#empty-top)" />
				<rect x="-32" y="-32" width="58" height="58" rx="14" fill="#DDD1FF" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,214,80)">
				<rect x="-26" y="-26" width="52" height="52" rx="12" fill="url(#empty-side)" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,214,68)">
				<rect x="-26" y="-26" width="52" height="52" rx="12" fill="url(#empty-tile)" />
			</g>
		</svg>
	);
}

/** The same slab with a tile knocked loose and a cross beside it: the day could not be read. */
export function LoadFailedIllustration() {
	return (
		<svg width="168" height="146" viewBox="0 0 300 260" fill="none" aria-hidden="true">
			<Gradients prefix="failed" />
			<g transform="matrix(.866,.5,-.866,.5,150,176)">
				<rect x="-70" y="-70" width="140" height="140" rx="24" fill="url(#failed-side)" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,150,140)">
				<rect x="-70" y="-70" width="140" height="140" rx="24" fill="url(#failed-top)" />
				<rect x="-32" y="-32" width="58" height="58" rx="14" fill="#DDD1FF" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,84,66) rotate(10)">
				<rect x="-26" y="-26" width="52" height="52" rx="12" fill="url(#failed-side)" />
			</g>
			<g transform="matrix(.866,.5,-.866,.5,84,54) rotate(10)">
				<rect x="-26" y="-26" width="52" height="52" rx="12" fill="url(#failed-tile)" />
			</g>
			<g stroke="#B3261E" strokeWidth="11" strokeLinecap="round">
				<path d="M218 98 246 126" />
				<path d="M246 98 218 126" />
			</g>
		</svg>
	);
}

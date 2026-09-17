import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route } from './index';

afterEach(() => {
	vi.useRealTimers();
});

function runGuard(): unknown {
	const beforeLoad = Route.options.beforeLoad as () => void;

	try {
		beforeLoad();

		return undefined;
	} catch (thrown) {
		return thrown;
	}
}

describe('the index route', () => {
	/** The day view defaults to today, and always carries its date in the URL (ADR-0007). */
	it('redirects to today', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date(2026, 8, 15, 22, 30));

		// The target lives under `options`: a thrown redirect is a Response subclass, and the
		// navigation it describes is not spread onto it.
		expect(runGuard()).toMatchObject({
			options: { to: '/day/$date', params: { date: '2026-09-15' }, replace: true },
		});
	});
});

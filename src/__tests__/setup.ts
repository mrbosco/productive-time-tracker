import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetMockData } from '@/mocks/handlers';
import { server } from '@/mocks/node';

// jsdom implements no scrolling, and the router scrolls on navigation. Without this every
// navigation in a test writes a "Not implemented" block to the console and buries real output.
window.scrollTo = () => undefined;

// `error` on unhandled requests: a test that hits an unmocked endpoint is a test
// that would hit the real API in CI. Fail loudly instead.
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
	cleanup();
	server.resetHandlers();
	// `resetHandlers` restores which handlers are installed, not what they remember.
	resetMockData();
	// The session lives here (ADR-0004), so a test that logs in would otherwise leave the next
	// one already logged in.
	window.localStorage.clear();
	// A spy left on a global (`Storage.prototype`, `fetch`) is invisible from the test that then
	// trips over it.
	vi.restoreAllMocks();
});

afterAll(() => {
	server.close();
});

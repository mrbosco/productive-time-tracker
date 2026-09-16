import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { resetMockData } from '@/mocks/handlers';
import { server } from '@/mocks/node';

// jsdom implements no scrolling, and the router scrolls on navigation. Without this every
// navigation in a test writes a "Not implemented" block to the console and buries real output.
window.scrollTo = () => undefined;

/**
 * jsdom lays nothing out, so it ships no `getClientRects` on `Range`. ProseMirror asks for one
 * every time it scrolls a selection into view (ADR-0010), and the throw lands outside any test's
 * call stack - so the suite reports every test passing and still exits non-zero, which is how this
 * reached CI.
 *
 * An empty list is the honest answer here: there are no rectangles, because there is no layout.
 * Anything that actually depends on geometry is an e2e test.
 */
const EMPTY_RECT = {
	x: 0,
	y: 0,
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	width: 0,
	height: 0,
	toJSON: () => ({}),
} as DOMRect;

const EMPTY_RECT_LIST = Object.assign([] as DOMRect[], {
	item: () => null,
}) as unknown as DOMRectList;

// Assigned outright rather than guarded. Reading a prototype method to test for it is the unbound
// access the lint rule exists to catch, and an `in` check narrows the negative branch to `never`
// because the DOM types say these exist. Overriding unconditionally states the fact directly:
// under this environment there is no layout, whatever jsdom does or does not implement.
Range.prototype.getClientRects = () => EMPTY_RECT_LIST;
Range.prototype.getBoundingClientRect = () => EMPTY_RECT;
Element.prototype.getClientRects = () => EMPTY_RECT_LIST;

// Same reason: ProseMirror maps a mousedown back to a document position, and jsdom has no point
// to hit. Returning nothing is correct - a click in a laid-out-less document lands on nothing.
document.elementFromPoint = () => null;

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

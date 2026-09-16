import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/node';

// `error` on unhandled requests: a test that hits an unmocked endpoint is a test
// that would hit the real API in CI. Fail loudly instead.
beforeAll(() => {
	server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
	cleanup();
	server.resetHandlers();
});

afterAll(() => {
	server.close();
});

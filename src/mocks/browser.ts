import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/** Used by `pnpm dev:mock` and, through it, by Playwright's webServer. */
export const worker = setupWorker(...handlers);

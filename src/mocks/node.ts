import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** Used by Vitest via `src/__tests__/setup.ts`. */
export const server = setupServer(...handlers);

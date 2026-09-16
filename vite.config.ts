/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		// Must precede @vitejs/plugin-react so generated route files get Fast Refresh.
		tanstackRouter({
			target: 'react',
			autoCodeSplitting: true,
			// Tests are colocated (guidebook 19), so a route's test sits in `src/routes/` beside it
			// and would otherwise be scanned as a route and warned about for exporting none.
			routeFileIgnorePattern: '\\.test\\.tsx?$',
		}),
		react(),
		tailwindcss(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	test: {
		// No .env is present in a fresh clone; src/api reads this, so pin it for the run.
		env: { VITE_API_BASE_URL: 'https://api.productive.io/api/v2' },
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/__tests__/setup.ts'],
		css: false,
		// `.claude/worktrees` holds git worktrees of this same repo, so their `src/**` tests
		// would otherwise be collected here and run against the checkout they do not belong to.
		exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**', '.claude/**'],
	},
});

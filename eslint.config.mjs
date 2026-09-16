import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: [
			'dist',
			'coverage',
			'playwright-report',
			'test-results',
			'src/routeTree.gen.ts',
			'public/mockServiceWorker.js',
			// Git worktrees of this repo; each is linted from its own checkout.
			'.claude/worktrees',
		],
	},
	js.configs.recommended,
	// Guidebook rule 25 names stylisticTypeChecked only; recommendedTypeChecked is added
	// because stylistic ships no bug-catching rules (no-floating-promises and friends).
	tseslint.configs.recommendedTypeChecked,
	tseslint.configs.stylisticTypeChecked,
	react.configs.flat['jsx-runtime'],
	reactHooks.configs.flat.recommended,
	{
		languageOptions: {
			ecmaVersion: 2023,
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
		settings: {
			react: { version: 'detect' },
		},
	},
	{
		files: ['**/*.{js,mjs,cjs}'],
		extends: [tseslint.configs.disableTypeChecked],
	},
	{
		// TanStack Router signals a redirect by throwing the object `redirect()` returns, which is
		// not an Error. The rule is right in general, so the exception names that one type rather
		// than switching the rule off.
		files: ['src/routes/**/*.tsx'],
		rules: {
			'@typescript-eslint/only-throw-error': [
				'error',
				{ allow: [{ from: 'package', package: '@tanstack/router-core', name: 'Redirect' }] },
			],
		},
	},
	// Prettier last: it turns off every stylistic rule the formatter owns.
	prettierRecommended
);

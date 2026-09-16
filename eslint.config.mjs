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
	// Prettier last: it turns off every stylistic rule the formatter owns.
	prettierRecommended
);

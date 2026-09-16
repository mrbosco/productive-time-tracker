/** Infinum handbook configuration (guidebook rule 24). @type {import('prettier').Config} */
export default {
	printWidth: 120,
	useTabs: true,
	singleQuote: true,
	semi: true,
	trailingComma: 'es5',
	arrowParens: 'always',
	endOfLine: 'lf',
	// Rule 17: class ordering lives here, not in ESLint (the Tailwind plugin is not v4 compatible).
	plugins: ['prettier-plugin-tailwindcss'],
	tailwindStylesheet: './src/styles/index.css',
	tailwindFunctions: ['cn', 'cva'],
};

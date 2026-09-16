const emoji = /\p{Extended_Pictographic}/u;

/**
 * Allowed commit scopes. Feature scopes mirror the domains in `src/components/features/`
 * (SPEC 6.1); the rest cover the infrastructure areas.
 *
 * This list is duplicated in `.claude/rules/git.md`. Adding or renaming a scope means
 * editing both files in the same commit, or the rule and its enforcement drift apart.
 */
const SCOPES = [
	// features
	'auth',
	'time-entries',
	'settings',
	'timer',
	'week',
	'quick-add',
	// infrastructure
	'scaffold',
	'api',
	'router',
	'ui',
	'lib',
	'mocks',
	'e2e',
	'ci',
	'deps',
	'docs',
	'spec',
	'claude',
	'release',
];

/**
 * Conventional Commits, no emoji. config-conventional has no emoji rule, so it is a
 * local plugin rule here (guidebook rule 26).
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
	extends: ['@commitlint/config-conventional'],
	plugins: [
		{
			rules: {
				'no-emoji': ({ raw }) => [!emoji.test(raw ?? ''), 'commit message must not contain emoji'],
			},
		},
	],
	// The version bump commit is written by changesets/action, not by a human, and is
	// scopeless by design. It is the one message exempt from the rules below.
	ignores: [(message) => message.startsWith('Version Packages')],
	rules: {
		'no-emoji': [2, 'always'],
		// Every commit names the area it touches; there is a scope for tooling too.
		'scope-empty': [2, 'never'],
		'scope-enum': [2, 'always', SCOPES],
	},
};

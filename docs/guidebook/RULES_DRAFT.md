# Guidebook rules (distilled from the Infinum Frontend Handbook)

Purpose: this is the input for `.claude/rules/guidebook.md` (path-scoped to `src/**`). The full handbook stays in `docs/guidebook/infinum-handbook.md`. Each rule cites the handbook chapter so reviewers can trace it. Items marked "adapted" differ from the handbook because the handbook assumes Next.js and this project is a Vite SPA.

## Component organisation (chapter: React > Project structure)

1. Three component domains under `src/components/`: `core` (atoms: Button, Card, Input), `shared` (composed, reused across features: fields, layouts, EmptyState), `features/<domain>` (feature-specific sections).
2. Folder and file names: `kebab-case` for domain folders, `PascalCase` for component folders and files (`TimeEntryCard/TimeEntryCard.tsx`).
3. Component-adjacent files use suffixes: `X.test.tsx`, `X.hooks.ts`, `X.utils.ts`, `X.elements.ts`; responsive variants in `layouts/X.mobile.tsx` / `X.desktop.tsx` only when the layouts differ substantially.
4. Adapted: route components live in `src/routes/` (the handbook's `pages/` is a Next.js concept).
5. Adapted: API access lives in `src/api/` with one module per resource; hooks that wrap TanStack Query live next to the feature (`features/time-entries/useTimeEntries.ts`). The handbook's `fetchers/` + datx pattern is not used (ADR-0002).

## Naming (chapter: Naming rules)

6. Components follow `HighContext? + LowContext? + Base + Part? + Suffix?`: `Card`, `TimeEntryCard`, `TimeEntryCardFallback`. Never two base names in one component (`ButtonLink`); use polymorphic `as`/`asChild` instead.
7. Functions are verbs, descriptive, no abbreviations: `calculateDayTotal`, not `calcTtl`. Variables carry context: `durationMinutes`, not `d`.
8. Boolean props and variables read as predicates: `isLoading`, `hasEntries`, `canDelete`.

## Hooks (chapter: React > Hooks)

9. Every `useEffect` has an accurate dependency array; never suppress the exhaustive-deps rule.
10. Derive state from previous state with the updater form; lazy-initialise expensive initial state; declare functions outside the component when they use nothing from scope.
11. Use `useMemo`/`useCallback` only for measured render cost or referential stability required by a dependency array; do not memoise by default.
12. Encapsulate non-trivial logic in custom hooks colocated with the feature.

## Props (chapter: Component props)

13. Expose internal constants (magic numbers, limits) as props with defaults.
14. Do not shadow or rename props when passing through higher abstractions.

## Styling (chapters: Tailwind CSS, shadcn/ui)

15. Tailwind v4 with design tokens in an `@theme` block; no inline style objects; no CSS-in-JS.
16. shadcn/ui components are copied into `src/components/core` and edited there; never import from a shadcn package at runtime.
17. Class ordering by `prettier-plugin-tailwindcss` (the Tailwind ESLint plugin is not v4 compatible).

## Accessibility (chapter: Accessibility)

18. Semantic HTML first; ARIA only when no native element exists. Every input has a visible `<label>`. Dialogs trap focus and return it on close. Focus is moved to the page heading on route change. Colour contrast AA. All interactive elements reachable and operable by keyboard.

## Testing (chapters: Testing best practices, React > Tests)

19. Tests are colocated with the unit under test; mocks in `__mocks__`; shared helpers in `src/__tests__/test-utils.tsx`.
20. Query by role and accessible name first (`getByRole('button', { name: /save/i })`); avoid test IDs unless there is no accessible handle.
21. User interactions via `@testing-library/user-event`, not `fireEvent`.
22. Test behaviour and rendered output, not implementation details or internal state.
23. Timers and async: use fake timers deliberately and `findBy*`/`waitFor` for async UI.

## Code quality and tooling (chapter: Code quality)

24. Prettier with the handbook configuration: `printWidth 120`, `useTabs true`, `singleQuote true`, `semi true`, `trailingComma es5`, `arrowParens always`, `endOfLine lf`. `.editorconfig` with tabs, size 2.
25. ESLint flat config (`eslint.config.mjs`) composed locally from `@eslint/js` recommended, `typescript-eslint` recommendedTypeChecked **and** stylisticTypeChecked, `eslint-plugin-react` jsx-runtime, `eslint-plugin-react-hooks` recommended (flat), `eslint-plugin-prettier/recommended` last. Adapted: the Next.js plugin sets are omitted. Adapted: `recommendedTypeChecked` was added to the handbook's stylistic-only set because stylistic ships no bug-catching rules — `no-floating-promises` and `no-misused-promises` matter with TanStack Query mutations and async submit handlers.
26. Husky pre-commit runs `lint-staged` (prettier + eslint on staged files). Commit messages validated by commitlint.

## Git and pull requests (chapter: Pull requests, Code review)

27. Small PRs, one feature each. Title includes the requirement ID (`R-9`, `US-2`) in place of a Productive task ID.
28. PR description: summary and reasoning, links to design (`docs/design/`) and spec sections, screenshot (mobile + desktop), test plan, open questions.
29. Code must be linted, formatted and unit-tested before review; coverage must not drop.
30. Review language when self-reviewing or when the reviewer agent comments: concise, advise rather than ask, recommend fixes.

## Versioning (chapter: Changesets)

31. Every PR that changes behaviour adds a changeset (`pnpm changeset`); release PRs bump the version and update `CHANGELOG.md`; tags follow `vX.Y.Z`.

## Logging (chapter: Pino) - not applicable

32. Adapted: Pino is a server-side logger; the SPA uses a tiny `logger` wrapper around `console` that is silenced in tests and never logs credentials.

## Explicitly not adopted (documented in ADR-0005)

- datx / MobX store, Next.js App Router, NextAuth, K6 load testing, Bugsnag, i18next.

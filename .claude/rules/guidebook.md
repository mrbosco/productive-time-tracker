---
description: Infinum handbook code conventions for application source
paths:
  - 'src/**'
---

# Guidebook rules

32 rules distilled from [Infinum's Frontend Handbook](https://infinum.com/handbook/frontend). **Numbering is load-bearing**: `prettier.config.mjs`, `eslint.config.mjs` and `commitlint.config.mjs` cite these numbers in comments. Never renumber; append instead.

"Adapted" marks a rule that differs from the handbook because the handbook assumes Next.js + Emotion and this is a Vite SPA.

## Component organisation (1-5)

1. Three domains under `src/components/`: `core` (atoms: Button, Card, Input), `shared` (composed, reused across features: fields, layouts, EmptyState), `features/<domain>` (feature-specific sections).
2. `kebab-case` for domain folders, `PascalCase` for component folders and files: `TimeEntryCard/TimeEntryCard.tsx`.
3. Component-adjacent files use suffixes: `X.test.tsx`, `X.hooks.ts`, `X.utils.ts`. Responsive variants go in `layouts/X.mobile.tsx` / `X.desktop.tsx`, and only when the layouts differ substantially. _(The handbook's `X.elements.ts` suffix is an Emotion convention and does not apply here; rule 15 forbids CSS-in-JS.)_
4. Adapted: route components live in `src/routes/` (the handbook's `pages/` is a Next.js concept).
5. Adapted: API access lives in `src/api/`, one module per resource. Hooks wrapping TanStack Query live next to the feature (`features/time-entries/useTimeEntries.ts`). The handbook's `fetchers/` + datx pattern is not used (ADR-0002).

## Naming (6-8)

6. Components follow `HighContext? + LowContext? + Base + Part? + Suffix?`: `Card`, `TimeEntryCard`, `TimeEntryCardFallback`. Never two base names in one component (`ButtonLink`); use a polymorphic `as`/`asChild` instead.
7. Functions are verbs, descriptive, unabbreviated: `calculateDayTotal`, not `calcTtl`. Variables carry context: `durationMinutes`, not `d`.
8. Booleans read as predicates: `isLoading`, `hasEntries`, `canDelete`.

## Hooks (9-12)

9. Every `useEffect` has an accurate dependency array. Never suppress `exhaustive-deps`.
10. Derive state from previous state with the updater form. Lazy-initialise expensive initial state. Declare functions outside the component when they close over nothing.
11. `useMemo`/`useCallback` only for measured render cost or referential stability a dependency array actually needs. Do not memoise by default.
12. Encapsulate non-trivial logic in custom hooks colocated with the feature.

## Props (13-14)

13. Expose internal constants (magic numbers, limits) as props with defaults.
14. Do not shadow or rename props when passing through a higher abstraction.

## Styling (15-17)

15. Tailwind v4 with design tokens in an `@theme` block. No inline style objects, no CSS-in-JS.
16. shadcn/ui components are copied into `src/components/core` and edited there. Never import from a shadcn package at runtime.
17. Class ordering belongs to `prettier-plugin-tailwindcss`, configured in `prettier.config.mjs` (the Tailwind ESLint plugin is not v4 compatible). Do not hand-sort classes.

## Accessibility (18)

18. Semantic HTML first; ARIA only where no native element exists. Every input has a visible `<label>`. Dialogs trap focus and return it on close. Focus moves to the page heading on route change. Colour contrast AA. Every interactive element is reachable and operable by keyboard.

## Testing (19-23)

Full detail in `.claude/rules/testing.md`, which governs test files themselves.

19. Tests are colocated with the unit under test. Mocks in `__mocks__`, shared helpers in `src/__tests__/test-utils.tsx`.
20. Query by role and accessible name first: `getByRole('button', { name: /save/i })`. Avoid test IDs unless there is no accessible handle.
21. Interactions through `@testing-library/user-event`, not `fireEvent`.
22. Test behaviour and rendered output, never implementation details or internal state.
23. Use fake timers deliberately; `findBy*`/`waitFor` for async UI.

## Code quality and tooling (24-26)

These are already implemented. Treat them as constraints on the config files, not as work to do.

24. Prettier per the handbook: `printWidth 120`, `useTabs true`, `singleQuote true`, `semi true`, `trailingComma es5`, `arrowParens always`, `endOfLine lf`; `.editorconfig` tabs, size 2. Implemented in `prettier.config.mjs` and `.editorconfig`.
25. ESLint flat config composed locally from `@eslint/js` recommended, `typescript-eslint` recommendedTypeChecked **and** stylisticTypeChecked, `eslint-plugin-react` jsx-runtime, `eslint-plugin-react-hooks` recommended, `eslint-plugin-prettier/recommended` last. Adapted: Next.js plugin sets omitted; `recommendedTypeChecked` added because stylistic ships no bug-catching rules, and `no-floating-promises` / `no-misused-promises` matter with TanStack Query mutations and async submit handlers. Implemented in `eslint.config.mjs`.
26. Husky pre-commit runs `lint-staged`; commit messages are validated by commitlint. Implemented in `.husky/` and `commitlint.config.mjs`.

## Git and pull requests (27-30)

Format detail in `.claude/rules/git.md`.

27. Small PRs, one story each. The title carries the requirement ID: `feat(time-entries): add entry form (US-2)`.
28. PR description: summary and reasoning, links to the relevant SPEC sections, screenshots on mobile and desktop, test plan, open questions.
29. Code is linted, formatted and unit-tested before review. Coverage must not drop.
30. Review language, including from the `reviewer` agent: concise, advise rather than ask, recommend the fix.

## Versioning (31)

31. Every PR that changes behaviour adds a changeset (`pnpm changeset`). Release PRs bump the version and update `CHANGELOG.md`. Tags follow `vX.Y.Z`.

## Logging (32)

32. Adapted: Pino is server-side. The SPA uses a small `logger` wrapper around `console`, silenced in tests, that never logs credentials.

## Not adopted

datx / MobX store, Next.js App Router, NextAuth, K6, Bugsnag, i18next. Reasoning in `docs/adr/0005-scope-cuts.md`. Proposing any of these requires a new ADR first.

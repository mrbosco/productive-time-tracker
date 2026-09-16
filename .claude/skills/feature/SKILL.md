---
name: feature
description: Implement one user story or extra feature end to end - branch, code, tests, changeset, commit. Use when starting work on an R-, US-, X- or P- identifier from docs/SPEC.md.
---

# Build a feature

One story per branch. If the request spans two stories, stop and split it.

## 1. Locate the requirement

Find the ID in `docs/SPEC.md` before writing anything:

- `US-n` / `R-n`: the tables in 2.1. Note every `R-` row tracing to the story; they are the acceptance criteria.
- `X-n` / `P-n`: the table in 10, which carries the full scope of each extra.

Also read: the route in 6.2, the state keys in 6.3, the matching screens in `docs/design/screens/`, and any ADR the spec cites. If the requirement is ambiguous, check 5 (assumptions) before asking - it may already be decided.

Do not start an extra (`X-`, `P-`) until the required stories are merged (SPEC 10).

## 2. Branch

```sh
git switch -c feat/<scope>-<short-description>
```

Scope comes from the list in `.claude/rules/git.md`.

## 3. Plan the files

Place them per SPEC 6.1 and guidebook 1-5:

- Feature UI and its hooks: `src/components/features/<domain>/`
- Reused across features: `src/components/shared/`
- shadcn primitive: `src/components/core/`, copied in and edited there (guidebook 16)
- Resource access: `src/api/<resource>.ts`, through the shared `client.ts`
- Pure logic: `src/lib/`
- Route: `src/routes/`, file-based. `routeTree.gen.ts` regenerates itself, never edit it

`PascalCase` component folders and files, `kebab-case` domain folders.

## 4. Implement

Follow `.claude/rules/guidebook.md`. The ones most often missed:

- Every input has a visible label; dialogs trap and restore focus; keyboard operable (18)
- No `useMemo`/`useCallback` without a measured reason (11)
- Booleans read as predicates; no abbreviated names (7, 8)
- Tailwind classes stay unsorted by hand - the Prettier plugin orders them (17)

Server state goes through TanStack Query with the key shapes fixed in SPEC 6.3. Forms are react-hook-form + zod; share the schema between create and edit.

Need an endpoint, payload shape or filter syntax? Use the `api-explorer` agent rather than guessing.

## 5. Test

Per `.claude/rules/testing.md`. Minimum for a story:

- Unit tests for any pure logic added to `lib/`
- Component tests covering loading, empty, error and data states
- Add or extend MSW handlers in `src/mocks/handlers.ts` - unhandled requests fail the suite
- One Playwright spec in `e2e/` for the story, passing on both projects

```sh
pnpm lint && pnpm typecheck && pnpm test
```

Run `pnpm test:e2e` before the PR, not on every iteration.

## 6. Changeset

Every behaviour change (guidebook 31):

```sh
pnpm changeset
```

Patch for fixes, minor for features. The summary is user-facing - it lands in `CHANGELOG.md`.

## 7. Commit

Format in `.claude/rules/git.md`. Scope from the list, `Refs:` footer with the story ID:

```
feat(time-entries): add entry form with inline validation

The day list had no create path. The zod schema is shared with the edit route
so both surfaces reject the same input.

Refs: US-2, R-9
```

Commit only when the user asks. Then use the `pr` skill.

## Done when

Every `R-` row traced to the story is satisfied, all four list states are handled where a list exists, the mobile project passes (N-4), a changeset exists, and lint, typecheck and tests are green.

---
description: Commit message and pull request format
---

# Git

## Commit format

Conventional Commits, validated by `commitlint.config.mjs` on every commit via the Husky `commit-msg` hook.

```
type(scope): subject

Body: why this change, not what the diff shows.

Refs: US-2, R-9
```

- **type**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`, `revert`.
- **scope**: required on every commit, from the list below. `scope-empty` is set to `never`, so a scopeless commit is rejected.
- **subject**: imperative, lower case, no trailing full stop.
- **no emoji anywhere** in the message. Enforced by the local `no-emoji` rule.

## Scopes

Feature scopes, one per domain in `src/components/features/` (SPEC 6.1):

`auth` · `time-entries` · `settings` · `timer` · `week` · `quick-add`

Infrastructure scopes:

`scaffold` · `api` · `router` · `ui` · `lib` · `mocks` · `e2e` · `ci` · `deps` · `docs` · `claude` · `release`

`scaffold` covers build/tooling config (Vite, TypeScript, ESLint, Prettier, Husky, Changesets). `ui` covers `components/core/` and `components/shared/`. `router` covers `src/routes/` and router setup. `claude` covers `.claude/` and `CLAUDE.md`. `release` is for version bumps and tags.

> This list is duplicated in `commitlint.config.mjs` as `SCOPES`. **Adding or renaming a scope means editing both files in the same commit**, or the rule and the enforcement drift apart.

## Body

Explain the reasoning: what was wrong or missing, and why this approach. The diff already says what changed. A body is optional for a one-line mechanical change, expected for anything else.

Wrap at 100 columns. Reference an ADR by ID when the change follows one.

## Footer

Every commit that changes behaviour references at least one SPEC identifier:

```
Refs: US-2
Refs: US-2, R-9
Refs: X-1
```

- `US-n` is the canonical form, from SPEC 2.1's Source column. `UC-n` in `docs/diagrams/01-use-cases.mmd` maps 1:1 to `US-n`; write `US-n`.
- `R-n` for a functional requirement, `X-n` / `P-n` for an extra feature from SPEC 10.
- Chores (tooling, CI, docs, config) use `Refs: ADR-000n` when a decision drove them, otherwise no footer.
- Never invent an ID. If nothing in `docs/SPEC.md` covers the change, either it belongs to a requirement you have not identified, or the spec needs updating first.

## Examples

```
feat(time-entries): add entry form with inline validation

The day list had no create path. Validation lives in a zod schema shared with
the edit route so both surfaces reject the same input.

Refs: US-2, R-9
```

```
chore(claude): add rules, skills and agents

Refs: ADR-0005
```

## Branches and pull requests

- One user story per branch and per PR (SPEC 12). Branch `type/scope-short-description`, e.g. `feat/time-entries-create`.
- PR title repeats the commit format with the ID in parentheses: `feat(time-entries): add entry form (US-2)`.
- PR body follows guidebook rule 28: summary and reasoning, links to `docs/design/` and the SPEC sections, mobile and desktop screenshots, test plan, open questions. Use the `pr` skill.
- Before opening: lint, typecheck, unit tests, e2e all pass and a changeset exists (guidebook 29, 31).

## Constraints

- `main` is the release branch and is protected. Never commit to it directly, never force-push it. Force-push is blocked in `.claude/settings.json` in every spelling.
- **`main` currently has zero commits.** The first commit has no baseline, so `git diff HEAD` fails; use `git status --short` and `git diff --cached` after staging.
- Never commit `.env`, tokens or organization IDs. `.gitignore` covers `.env*` except `.env.example`.
- Do not commit on the user's behalf unless asked.

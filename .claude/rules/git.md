---
description: Commit message and pull request format
---

# Git

## Commit format

Conventional Commits, validated by `commitlint.config.mjs` on every commit via the Husky `commit-msg` hook.

```
type(scope): subject

Body: why this change, not what the diff shows.

Refs: R-9
```

- **type**: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `build`, `ci`, `chore`, `style`, `revert`.
- **scope**: required on every commit, from the list below. `scope-empty` is set to `never`, so a scopeless commit is rejected. One exception: `Version Packages`, written by `changesets/action`, is allowlisted in `commitlint.config.mjs` (`ignores`). It is the only scopeless commit on `main`, and no human writes it.
- **subject**: imperative, lower case, no trailing full stop.
- **no emoji anywhere** in the message. Enforced by the local `no-emoji` rule.

## Scopes

Feature scopes, one per domain in `src/components/features/` (SPEC 1):

`auth` · `time-entries` · `settings` · `timer` · `week` · `quick-add`

Infrastructure scopes:

`scaffold` · `api` · `router` · `ui` · `lib` · `mocks` · `e2e` · `ci` · `deps` · `docs` · `spec` · `claude` · `release`

`scaffold` covers build/tooling config (Vite, TypeScript, ESLint, Prettier, Husky, Changesets). `ui` covers `components/core/` and `components/shared/`, and a presentational pass that crosses several features at once without changing what any of them does - a design pass is one change, and splitting it across feature scopes would describe it as several. `router` covers `src/routes/` and router setup. `spec` covers `docs/SPEC.md`, the ADRs and the diagrams; `docs` covers the rest of `docs/`. `claude` covers `.claude/` and `CLAUDE.md`. `release` is for version bumps and tags.

> This list is duplicated in `commitlint.config.mjs` as `SCOPES`. **Adding or renaming a scope means editing both files in the same commit**, or the rule and the enforcement drift apart.

## Body

Explain the reasoning: what was wrong or missing, and why this approach. The diff already says what changed. A body is optional for a one-line mechanical change, expected for anything else.

Wrap at 100 columns. Reference an ADR by ID when the change follows one.

## Footer

Every commit that changes behaviour references at least one SPEC identifier:

```
Refs: R-9
Refs: R-9, R-11
Refs: N-4
```

- `R-n` is a functional requirement and `N-n` a constraint, both from `docs/SPEC.md` section 9.
- `X-n` is a feature beyond the assignment and `P-n` a polish item, both from section 6, defined in `docs/adr/0008-extra-features.md`.
- `A-n` is an assumption, from section 4, for a change that rests on one.
- `UC-n` in `docs/diagrams/01-use-cases.mmd` names a use case; reference it as `UC-n`.
- Chores (tooling, CI, docs, config) use `Refs: ADR-000n` when a decision drove them, otherwise no footer.
- Never invent an ID. If nothing in `docs/SPEC.md` covers the change, either it belongs to a requirement you have not identified, or the spec needs updating first.

## Examples

```
feat(time-entries): add entry form with inline validation

The day list had no create path. Validation lives in a zod schema shared with
the edit route so both surfaces reject the same input.

Refs: R-9
```

```
chore(claude): add rules, skills and agents

Refs: ADR-0005
```

## Branches and pull requests

- One feature per branch and per PR. Branch `type/scope-short-description`, e.g. `feat/time-entries-create`.
- PR title repeats the commit format: `feat(time-entries): add entry form`.
- PR body follows `.github/PULL_REQUEST_TEMPLATE.md`, which is guidebook rule 28 verbatim: Summary, Reasoning, Spec and design, Screenshots, Test plan, Open questions, then a Checklist. Use the `pr` skill.
- Before opening: lint, typecheck, unit tests, e2e all pass and a changeset exists (guidebook 29, 31). `.github/workflows/ci.yml` runs the same gate on every PR, and fails a `feat/`, `fix/` or `perf/` branch that carries no changeset.

## Constraints

- `main` is the release branch and is protected. Never commit to it directly, never force-push it. Force-push is blocked in `.claude/settings.json` in every spelling.
- Never commit `.env`, tokens or organization IDs. `.gitignore` covers `.env*` except `.env.example`.
- Do not commit on the user's behalf unless asked.

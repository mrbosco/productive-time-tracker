---
name: pr
description: Open a pull request - run the full gate, then write the title and body in the house format. Use when a feature branch is ready for review.
---

# Open a pull request

One story per PR (SPEC 12, guidebook 27). If the branch carries two, split it before opening.

## 1. Gate

All four pass before the PR exists (guidebook 29):

```sh
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e
```

`.github/workflows/ci.yml` runs the same four commands plus `changeset status`, so a red gate surfaces either way - locally is just faster than a round trip.

Then confirm:

- A changeset exists for behaviour changes: `ls .changeset/*.md` shows more than `README.md`. CI enforces this on `feat/`, `fix/` and `perf/` branches
- Coverage has not dropped
- `git status --short` is clean apart from what you mean to push
- No credentials, tokens or organization IDs in the diff

If anything fails, fix it. Do not open a PR with a red gate and a note about it.

## 2. Review your own diff

```sh
git diff main...HEAD
```

Read it as a reviewer. For anything non-trivial, hand it to the `reviewer` agent first - cheaper than a round trip with a human.

## 3. Title

Commit format plus the ID in parentheses:

```
feat(time-entries): add entry form (US-2)
```

Scope from `.claude/rules/git.md`. The ID is the story the PR closes.

## 4. Body

`.github/PULL_REQUEST_TEMPLATE.md` pre-fills this; fill it in rather than writing from scratch. Guidebook rule 28 - all six sections, then the checklist:

```markdown
## Summary

What this adds, in two or three sentences.

## Reasoning

Why this approach. Alternatives rejected and why. Cite the ADR if one governs it.

## Spec and design

- Story: US-2
- Requirements: R-9, R-10 (SPEC 2.1)
- Route: `/entries/new` (SPEC 6.2)
- Design: `docs/design/screens/03-new-entry-mobile.png`, `03-new-entry-desktop.png`

## Screenshots

| Mobile (390px) | Desktop |
| -------------- | ------- |
| ...            | ...     |

## Test plan

- Unit: ...
- Component: loading, empty, error, data
- E2E: `e2e/create-entry.spec.ts`, both projects
- Manual smoke against the real API: ...

## Open questions

Anything you want the reviewer to decide. "None" is a valid answer.

## Checklist

- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all green
- [ ] Changeset added (every behaviour change, guidebook 31)
- [ ] Docs updated if behaviour changed
- [ ] No token, organization ID or other secret in the diff
- [ ] `US-n` / `R-n` / `X-n` / `P-n` in the title and in every `Refs:` footer
```

`US-n` is the canonical story ID, never `UC-n` - the same rule as commits (`.claude/rules/git.md`).

Screenshots are required, both viewports (N-4). Get them from the Playwright run or the dev server at a mobile viewport.

The manual smoke line matters: e2e runs against MSW only (ADR-0003), so nothing has touched the real Productive API unless you did.

## 5. Open it

```sh
git push -u origin HEAD
gh pr create --title "..." --body-file <path>
```

Write the body to a file in the scratchpad rather than inlining a long string.

Never force-push. It is blocked, and on a shared branch it destroys review history.

## 6. After opening

Report the URL. If CI fails, fix it on the branch - do not close and reopen.

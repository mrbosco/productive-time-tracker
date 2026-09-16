---
name: release
description: Cut a release - version with Changesets, update the changelog, tag and push. Use when a milestone from SPEC 12 is complete.
---

# Cut a release

Changesets owns the version. Never hand-edit `version` in `package.json` or `CHANGELOG.md`.

The package is `private: true` and `.changeset/config.json` sets `privatePackages: { version: true, tag: true }`: it versions and tags, and **publishes nothing to npm**. No `NPM_TOKEN` anywhere.

`.github/workflows/release.yml` drives this. You review and merge; the action versions, tags and publishes the GitHub Release.

## Milestones (SPEC 12)

| Tag      | Contains                                                 |
| -------- | -------------------------------------------------------- |
| `v0.1.0` | Scaffold, tooling only                                   |
| `v0.2.0` | The required stories: US-0 to US-4 / R-1 to R-12         |
| `v0.3.0` | Extras, in this order: X-1, X-2, P-2, X-3, X-4, X-5, P-1 |
| `v1.0.0` | Submission                                               |

Extras are cut without regret if the budget runs out; the README lists what shipped.

## 1. Changesets, during development

A release is only as good as the changesets that fed it. On the feature branch, before opening the PR:

```sh
pnpm changeset
```

- **Bump**: `patch` for a fix, `minor` for a feature. `major` is reserved for `v1.0.0`.
- **Summary**: one line, past tense, user-facing. "Added inline validation to the entry form", not "refactor useEntryForm". It lands in `CHANGELOG.md` verbatim and a user reads it there.
- Commit the generated `.changeset/*.md` with the feature, scope and all.

**CI fails a `feat/`, `fix/` or `perf/` branch with no changeset** - `.github/workflows/ci.yml` runs `changeset status --since=origin/main`. Branches prefixed `docs/`, `chore/`, `ci/` and the rest skip the check. If a `feat/` branch genuinely changes nothing user-visible, rename the branch rather than faking a changeset.

## 2. Check the gate

From `main`, up to date, with every PR for the milestone merged:

```sh
git switch main && git pull
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

CI has already run all of this on each PR. Running it locally before a milestone is cheap insurance that the merges compose.

## 3. Review the version PR

Every push to `main` with pending changesets makes `release.yml` open or update a PR titled **Version Packages**. It contains exactly two things: the `package.json` bump and the `CHANGELOG.md` entries.

Read the changelog diff before merging. It is user-facing - reword anything that still reads like a commit subject. Push the fix to the PR branch; the action leaves manual edits alone.

If the PR is missing, the usual cause is that no changeset reached `main`, or the repo setting **Settings - Actions - General - "Allow GitHub Actions to create and approve pull requests"** is off.

## 4. Merge it

Merging the Version Packages PR leaves no changesets on `main`, so the next `release.yml` run takes the other branch: it tags `vX.Y.Z` and creates the GitHub Release from the matching `CHANGELOG.md` section.

Confirm both landed - the tag on `main` and the Release - and report the tag. If the milestone is `v1.0.0`, check the README's "what shipped" list matches reality first.

If the run did not happen or the tag is missing, start it by hand instead of pushing an empty commit:

```sh
gh workflow run release.yml --ref main
```

It is safe to repeat: `changeset git-tag` skips a tag that already exists, and the action creates a Release only for a tag it just made. If the tag exists but the Release does not, create the Release by hand from the `CHANGELOG.md` section (see below).

## If the action is down

The manual path still works, and is what the workflow automates:

```sh
pnpm version
git add -A
git commit -m "Version Packages"
git tag v0.2.0
git push origin main --follow-tags
```

`Version Packages` is the one commit message commitlint exempts (`ignores` in `commitlint.config.mjs`) - it is scopeless because a machine writes it. Do not invent a scope for it; the rest of the rules still apply to every commit you write yourself.

Create the GitHub Release by hand from the `CHANGELOG.md` section for that version.

## Constraints

- Never force-push `main`; it is blocked and it rewrites published tags.
- Never tag a dirty tree or a red gate.
- Tags are `vX.Y.Z`, matching guidebook 31.

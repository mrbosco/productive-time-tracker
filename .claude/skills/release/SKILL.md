---
name: release
description: Cut a release - version with Changesets, update the changelog, tag and push. Use when a milestone from SPEC 12 is complete.
---

# Cut a release

Changesets owns the version. Never hand-edit `version` in `package.json` or `CHANGELOG.md`.

The package is `private: true` and `.changeset/config.json` sets `privatePackages: { version: true, tag: true }`: it versions and tags, and **publishes nothing to npm**.

## Milestones (SPEC 12)

| Tag      | Contains                                                 |
| -------- | -------------------------------------------------------- |
| `v0.1.0` | Scaffold, tooling only                                   |
| `v0.2.0` | The required stories: US-1 to US-4 / R-1 to R-12         |
| `v0.3.0` | Extras, in this order: X-1, X-2, P-2, X-3, X-4, X-5, P-1 |
| `v1.0.0` | Submission                                               |

Extras are cut without regret if the budget runs out; the README lists what shipped.

## 1. Check the gate

From `main`, up to date, with every PR for the milestone merged:

```sh
git switch main && git pull
pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build
```

`pnpm build` matters here - it is the only step that proves the production bundle compiles.

## 2. Confirm the changesets

```sh
ls .changeset/*.md
```

Every behaviour change in the milestone should have one. A missing changeset means a feature vanishes from the changelog - add it now (`pnpm changeset`) rather than editing the changelog later.

## 3. Version

```sh
pnpm version
```

This runs `changeset version`: it consumes `.changeset/*.md`, bumps `package.json`, and writes `CHANGELOG.md`.

Read the changelog before continuing. It is user-facing - reword entries that read like commit subjects.

## 4. Commit and tag

```sh
git add -A
git commit -m "chore(release): v0.2.0"
git tag v0.2.0
```

`commit: false` in the changeset config is deliberate: the commit is yours to make and review.

The commit needs a scope (`release`) like any other. No `Refs:` footer - the changelog carries the detail.

## 5. Push

```sh
git push origin main --follow-tags
```

Confirm the tag landed and report it. If the milestone is `v1.0.0`, check the README's "what shipped" list matches reality before pushing.

## Constraints

- Never force-push `main`; it is blocked and it rewrites published tags.
- Never tag a dirty tree or a red gate.
- Tags are `vX.Y.Z`, matching guidebook 31.

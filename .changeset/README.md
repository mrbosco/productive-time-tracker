# Changesets

Every pull request that changes behaviour adds one (guidebook rule 31):

```sh
pnpm changeset
```

The app is private, so `privatePackages` is configured to still version and tag it —
`pnpm changeset version` bumps `package.json` and writes `CHANGELOG.md`, and the release
tag follows `vX.Y.Z` (SPEC §12).

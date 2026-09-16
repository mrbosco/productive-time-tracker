#!/usr/bin/env bash
# PostToolUse: format the file Claude just wrote.
# Prettier reads prettier.config.mjs and honours .prettierignore itself, so files
# like docs/, src/routeTree.gen.ts and the lockfile are skipped without logic here.
# --ignore-unknown makes non-formattable extensions a no-op rather than an error.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0

# cd first: file_path may be relative, and the hook's cwd is not guaranteed.
# ${VAR:-.} keeps `set -u` from aborting when CLAUDE_PROJECT_DIR is unset.
cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || exit 0
[ -f "$file" ] || exit 0

pnpm exec prettier --write --ignore-unknown "$file" >/dev/null 2>&1 || true
exit 0

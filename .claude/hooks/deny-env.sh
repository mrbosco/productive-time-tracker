#!/usr/bin/env bash
# PreToolUse: refuse to write any .env file. .env.example is tracked, secret-free
# and documents the required vars, so it stays editable.
# Exit 2 blocks the tool call and returns stderr to Claude.
set -euo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0

name=$(basename "$file")
case "$name" in
	.env.example) exit 0 ;;
	.env | .env.*)
		echo "Blocked: $name holds secrets and is gitignored. Edit .env.example instead, or ask the user to change .env themselves." >&2
		exit 2
		;;
esac
exit 0

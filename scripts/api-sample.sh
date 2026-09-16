#!/usr/bin/env bash
#
# Records one live Productive API response into docs/api/samples/.
#
# An API question this repo cannot answer is settled by making the real request and saving the
# response (.claude/rules/api-client.md rule 25). This script is that procedure, so it runs the
# same way twice and so the credentials never reach a terminal, a log, a process listing or an
# agent's context.
#
#   ./scripts/api-sample.sh <sample-name> <path-with-query> [organization-id]
#
#   ./scripts/api-sample.sh organization-memberships-include-organization \
#       '/organization_memberships?include=person,organization&fields[organizations]=name'
#   ./scripts/api-sample.sh organization-memberships-unknown-organization \
#       '/organization_memberships?include=person,organization' 1234
#
# Credentials come from .env.local, which is gitignored. The third argument overrides the
# organization header for that request only, which is how a wrong-organization response gets
# recorded without touching the stored credentials.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ $# -lt 2 ]; then
  sed -n '2,19p' "$0" | sed 's/^#//'
  exit 64
fi

NAME="$1"
REQUEST_PATH="$2"

if [ ! -f .env.local ]; then
  echo "error: .env.local not found. It holds the recording credentials and is gitignored." >&2
  exit 66
fi

set -a
# shellcheck disable=SC1091
. ./.env.local
set +a

# The variable names are not fixed across checkouts, so accept the plausible ones. Only the NAME
# that resolved is ever reported, never a value.
TOKEN="${PRODUCTIVE_API_TOKEN:-${PRODUCTIVE_TOKEN:-${API_TOKEN:-}}}"
REAL_ORG="${PRODUCTIVE_ORGANIZATION_ID:-${PRODUCTIVE_ORG_ID:-${ORGANIZATION_ID:-${ORG_ID:-}}}}"

if [ -z "$TOKEN" ]; then
  echo "error: no token in .env.local. Expected PRODUCTIVE_API_TOKEN, PRODUCTIVE_TOKEN or API_TOKEN." >&2
  exit 78
fi
if [ -z "$REAL_ORG" ]; then
  echo "error: no organization id in .env.local. Expected PRODUCTIVE_ORGANIZATION_ID," >&2
  echo "       PRODUCTIVE_ORG_ID, ORGANIZATION_ID or ORG_ID." >&2
  exit 78
fi

ORG="${3:-$REAL_ORG}"
BASE="${VITE_API_BASE_URL:-https://api.productive.io/api/v2}"
OUT="docs/api/samples/${NAME}.json"
STATUS_LOG="docs/api/samples/http-status-lines.txt"
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT

# The credential headers go in over stdin, never as arguments: anything on the command line is in
# this process's argv and readable by `ps auxww` for as long as the request runs.
#
# -g is not optional either. Without it curl reads the [ and ] in `fields[organizations]` and
# `page[size]` as glob ranges and drops those parameters silently, which turns a narrow request
# into a full-record one - and a full organization record carries an invitation token, a billing
# email and analytics identifiers.
#
# -s so only the body is written, and never -v: it echoes request headers, and the token is one.
STATUS="$(
  printf 'header = "X-Auth-Token: %s"\nheader = "X-Organization-Id: %s"\n' "$TOKEN" "$ORG" |
    curl -gs --config - \
      -o "$BODY" -w '%{http_code}' \
      -H 'Accept: application/vnd.api+json' \
      "${BASE}${REQUEST_PATH}"
)"

# Scrubbing and the refusals below all happen before the body reaches a file the repository tracks.
python3 - "$BODY" "$OUT" "$REAL_ORG" "$REQUEST_PATH" "$TOKEN" <<'PY'
import json, re, sys

body_path, out_path, real_org, request_path, token = sys.argv[1:6]
raw = open(body_path, encoding='utf-8').read()

# Bounded, so an organization id that happens to sit inside a longer number - a person id, a deal
# id, a timestamp - is not silently rewritten along with it.
raw = re.sub(rf'(?<!\d){re.escape(real_org)}(?!\d)', '999999', raw)


def refuse(reason):
    print(f'refused to write {out_path}: {reason}', file=sys.stderr)
    raise SystemExit(1)


def check(text):
    """Every refusal runs against whatever is about to be written, JSON or not."""
    if token and token in text:
        refuse('the response echoes the request token')
    # Key-name shaped, so client_secret, auth_token and api_token are caught as well as the exact
    # names that have bitten before. The real defence is a narrow fields[...] request; this is the
    # backstop for when that silently fails.
    secret = re.search(r'"[a-z0-9_]*(token|secret|password|api_key|credential)[a-z0-9_]*"\s*:', text, re.I)
    if secret:
        refuse(f'the response carries {secret.group(0)[:40]} - narrow it with fields[...]')


try:
    document = json.loads(raw)
except json.JSONDecodeError:
    # An HTML error page or a truncated body is still a recording, and still gets checked.
    check(raw)
    open(out_path, 'w', encoding='utf-8').write(raw)
    print('non-JSON body written verbatim')
    raise SystemExit(0)

# Human-readable names, wherever this API puts them. A type with no rule here is not scrubbed, so
# recording an endpoint that returns something else personal needs a look before it is committed.
NAMED_TYPES = {'organizations', 'companies', 'deals'}


def scrub(node, resource_type=None):
    if isinstance(node, dict):
        resource_type = node.get('type', resource_type)
        for key, value in list(node.items()):
            if key == 'first_name':
                node[key] = 'Ada'
            elif key == 'last_name':
                node[key] = 'Lovelace'
            elif key == 'email':
                node[key] = 'ada.lovelace@example.com'
            elif key == 'name' and resource_type in NAMED_TYPES:
                node[key] = f'Example {resource_type[:-1].title()}'
            elif isinstance(value, str) and re.search(r'avatar|gravatar', key, re.I):
                node[key] = 'https://example.com/avatar.png'
            else:
                scrub(value, resource_type)
    elif isinstance(node, list):
        for item in node:
            scrub(item, resource_type)


scrub(document)
text = json.dumps(document, indent=2) + '\n'
check(text)

# A dropped fields parameter is how a narrow request turns wide, and the API echoes the query it
# actually ran in `links`, so the two can be compared.
if 'fields[' in request_path:
    echoed = json.dumps(document.get('links', {}))
    if 'fields%5B' not in echoed and 'fields[' not in echoed:
        print('warning: the response did not echo a fields parameter - it may have been dropped',
              file=sys.stderr)

open(out_path, 'w', encoding='utf-8').write(text)
PY

# The status and the request that produced it are the whole finding for an error sample, and two
# samples can be byte-identical while differing only in the header that was sent. Record both.
if [ ! -f "$STATUS_LOG" ]; then
  echo "HTTP status recorded for each sample (curl -w '%{http_code}')." > "$STATUS_LOG"
  echo >> "$STATUS_LOG"
fi
python3 - "$STATUS_LOG" "${NAME}.json" "$STATUS" "${3:-}" <<'PY'
import sys

log_path, sample, status, org_override = sys.argv[1:5]
note = f'  [X-Organization-Id: {org_override}]' if org_override else ''
row = f'{sample:<52} {status}{note}'

lines = open(log_path, encoding='utf-8').read().rstrip('\n').split('\n')
lines = [line for line in lines if not line.startswith(f'{sample:<52}'.rstrip() + ' ')
         and not line.startswith(sample + ' ')]
lines.append(row)
open(log_path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
PY

echo "${NAME}: HTTP ${STATUS} -> ${OUT}"
if [ -n "${3:-}" ]; then
  echo "  organization header: ${3} (override)"
else
  echo "  organization header: the one in .env.local, scrubbed to 999999"
fi

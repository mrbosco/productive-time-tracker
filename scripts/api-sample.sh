#!/usr/bin/env bash
#
# Records one live Productive API response into docs/api/samples/.
#
# An API question this repo cannot answer is settled by making the real request and saving the
# response (.claude/rules/api-client.md rule 25). This script is that procedure, so it runs the
# same way twice and so the credentials never reach a terminal, a log or an agent's context.
#
#   ./scripts/api-sample.sh <sample-name> <path-with-query> [organization-id]
#
#   ./scripts/api-sample.sh organization-memberships-include-organization \
#       '/organization_memberships?include=person,organization&fields[organizations]=name'
#   ./scripts/api-sample.sh error-unknown-organization \
#       '/organization_memberships?include=person,organization' 1234
#
# Credentials come from .env.local, which is gitignored and never printed. The third argument
# overrides the organization header for that request only, which is how a wrong-organization
# response gets recorded without touching the stored credentials.
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
BODY="$(mktemp)"
trap 'rm -f "$BODY"' EXIT

# -g is not optional. Without it curl reads the [ and ] in `fields[organizations]` and
# `page[size]` as glob ranges and drops those parameters silently, which turns a narrow request
# into a full-record one - and a full organization record carries an invitation token, a billing
# email and analytics identifiers.
#
# -s so only the body is written, and never -v: it echoes request headers, and the token is one.
STATUS="$(curl -gs -o "$BODY" -w '%{http_code}' \
  -H "X-Auth-Token: ${TOKEN}" \
  -H "X-Organization-Id: ${ORG}" \
  -H 'Accept: application/vnd.api+json' \
  "${BASE}${REQUEST_PATH}")"

# Scrubbing and the secret check both happen before the body reaches a file the repository tracks.
python3 - "$BODY" "$OUT" "$REAL_ORG" "$REQUEST_PATH" <<'PY'
import json, re, sys

body_path, out_path, real_org, request_path = sys.argv[1:5]
raw = open(body_path, encoding='utf-8').read()
raw = raw.replace(real_org, '999999')

try:
    document = json.loads(raw)
except json.JSONDecodeError:
    open(out_path, 'w', encoding='utf-8').write(raw)
    print('non-JSON body written verbatim')
    raise SystemExit(0)

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
            elif key == 'name' and resource_type == 'organizations':
                node[key] = 'Example Organization'
            elif isinstance(value, str) and re.search(r'avatar|gravatar', key, re.I):
                node[key] = 'https://example.com/avatar.png'
            else:
                scrub(value, resource_type)
    elif isinstance(node, list):
        for item in node:
            scrub(item, resource_type)

scrub(document)
text = json.dumps(document, indent=2) + '\n'

# The real defence is asking for a narrow field set, and the check below is the backstop for when
# that silently fails. Anything matching these names means the response carries more than this
# repository should hold, so nothing is written and the request gets narrowed instead.
SECRETS = (
    'invitation_token', 'scim_bearer_token', 'billing_email', 'analytics_uid', 'email_key',
    'api_key', 'secret', 'password', 'private_key', 'access_token', 'refresh_token',
)
found = sorted({name for name in SECRETS if f'"{name}"' in text})
if found:
    print('refused to write: the response carries ' + ', '.join(found), file=sys.stderr)
    print('Narrow the request with a fields[...] parameter and record it again.', file=sys.stderr)
    raise SystemExit(1)

# A dropped fields parameter is the way that happens, and the API echoes the query it actually
# ran in `links`, so the two can be compared.
if 'fields[' in request_path:
    echoed = json.dumps(document.get('links', {}))
    if 'fields%5B' not in echoed and 'fields[' not in echoed:
        print('warning: the response did not echo a fields parameter - it may have been dropped',
              file=sys.stderr)

open(out_path, 'w', encoding='utf-8').write(text)
PY

echo "${NAME}: HTTP ${STATUS} -> ${OUT}"
if [ -n "${3:-}" ]; then
  echo "  organization header: ${3} (override)"
else
  echo "  organization header: the one in .env.local, scrubbed to 999999"
fi

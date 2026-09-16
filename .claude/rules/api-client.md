---
description: Constraints for the hand-written Productive JSON:API client
paths:
  - 'src/api/**'
---

# API client

Endpoint facts, payload shapes and error bodies live in `docs/api/README.md`, backed by recorded
responses in `docs/api/samples/`. Read it before adding a call. ADR-0002 holds the reasoning for a
hand-written client; ADR-0005 rules out generating types from the OpenAPI file.

## Boundaries

1. **No React in `src/api/`.** No hooks, no components, no TanStack Query imports. These are plain
   async functions. Hooks that wrap them live beside the feature
   (`features/time-entries/useTimeEntries.ts`) — guidebook rule 5.
2. **No retry, no caching, no deduplication here.** TanStack Query owns all three. A resource
   function issues one request and returns parsed data or throws.
3. **One module per resource**, kebab-case, named after the endpoint: `time-entries.ts`,
   `organization-memberships.ts`, `services.ts`, `timers.ts`.
4. **Credentials are an explicit argument**, never module-level state:
   `type Auth = { token: string; organizationId: string }`, passed first to every function. No
   singleton client holding a token.

## Requests

5. Every request sends `X-Auth-Token`, `X-Organization-Id` and `Accept: application/vnd.api+json`;
   POST/PATCH add `Content-Type: application/vnd.api+json`.
6. Base URL comes from `import.meta.env.VITE_API_BASE_URL`. Never hardcode the host.
7. **Never log, serialise or interpolate the token.** Not into a URL, a query key, an error message
   or a thrown object (ADR-0004, guidebook 32). `X-Organization-Id` is a header, never a query param.
8. **Always set `page[size]` explicitly.** The cap is 200. Read `meta.total_pages` and fetch
   subsequent pages when it exceeds 1 — an empty result reports `total_pages: 0`, so loop on
   `current_page < total_pages`, never on `total_pages > 0`.
9. **Use sparse fieldsets on every collection.** All three in use are narrowed: services 13x,
   memberships 12x, a day of time entries 5x. `fields` covers relationships as well as attributes —
   omit a relationship from the list and its linkage disappears while its `included` records remain,
   orphaned. It is honoured on collection endpoints only: `GET /time_entries/{id}` ignores `fields`
   and returns the full record, so do not send it there and imply a narrowing that never happens.
10. **Ask for every relationship you read, in `include`.** An un-included relationship serialises as
    `{"meta":{"included":false}}` with no `data` key and no ID. A missing `data` means "not
    requested", never "no related record" — do not branch on it as though it were an empty value.
    `readRelationshipId` returns `null` for both cases on purpose, because no caller needs to tell
    them apart; that makes the burden yours — never surface its `null` to a user as "none".
11. **Verify a new filter actually filters.** Unknown filter names are silently ignored, not
    rejected. Compare against an unfiltered count before trusting one.
12. Sorting on `/time_entries` accepts only `date` and `-date`. Anything else is a 400. Order within
    a day client-side (A-7).

## Responses

13. Parsing is one path: `data` / `included` / `meta`, with a single `included` lookup helper keyed
    by `(type, id)`. No second parser, no per-resource deserialiser.
14. **`204` must not be JSON-parsed.** `DELETE` returns 204 with no body and no `Content-Type`.
15. Mutation responses are not fully populated — POST and PATCH return only the `organization`
    relationship. Never read `service` or `person` off a create/update response.
16. `note` is `string | null`. `time` is an integer count of minutes and can legitimately be `0` in
    existing records, even though the create form rejects 0 (A-8).

## Errors

17. Every non-2xx throws `ApiError`. Nothing in `src/api/` returns an error as a value or swallows
    one.
18. `ApiError` carries the **HTTP status** plus the parsed `errors[]` entries
    (`{ code, title, detail, source }`). **Never read `errors[].status`** — it is sometimes a slug
    (`"unprocessable_content"`) that disagrees with the transport status.
19. Callers distinguish failures by HTTP status and `code`, not by matching on `detail` text.
    401 (`invalid_auth_token`) and 403 (`no_person`) are different user-facing problems: a wrong
    token versus a token with no person in that organization.
20. A network failure or a non-JSON body still throws `ApiError`, never a raw `TypeError` or a
    `SyntaxError` from `response.json()`.
21. `source.pointer` omits its leading slash (`data/attributes/person`), contrary to JSON:API. Do
    not build field-level form mapping on it.

## When the notes do not answer it

The Productive MCP server (`.mcp.json`, `https://mcp.productive.io/mcp`) is configured for this
project. It is the escalation path when this repo cannot answer an API question — use it instead of
guessing at a payload or brute-forcing routes.

25. **Order of resort**: `docs/api/README.md` and `docs/api/samples/` first, since they are already
    verified. Then the MCP, which talks to the same account and knows the schema. Then a recorded
    `curl`. Never a guess that goes straight into code.
26. **An MCP answer is a lead, not a citation.** It is a model reading an API, not a response this
    repo has seen. Confirm it with a real request and record the sample, then cite the sample. The
    stop endpoint is the cautionary tale: fifteen plausible routes 404'd and the answer
    (`PUT /timers/{id}/stop`) was a verb the path itself did not suggest — exactly the class of
    question to ask the MCP first, and exactly the class of answer to verify before trusting.
27. **The MCP can write.** It exposes create/update/delete across time entries, projects, invoices,
    expenses, payments and purchase orders — far beyond this app's four endpoints. Read and lookup
    calls are free. **Never call a mutating MCP tool without the user approving that specific
    change**, the same discipline the recorded write samples followed. A mutation here hits a real
    organization, and nothing in the tool name will warn you.
28. Its connection is one organization at a time and per-user, so what it reports is scoped to
    whoever authorised it. Say which organization an answer came from if it could matter.

## Tests

29. Every function added here needs an MSW handler in `src/mocks/handlers.ts` — the suite runs with
    `onUnhandledRequest: 'error'`, so an unhandled call fails the test rather than reaching the real
    API (ADR-0003).
30. Fixtures are the recorded samples in `docs/api/samples/`, imported directly. Never hand-write a
    response body for a real endpoint; if a shape is not recorded, record it. Synthesising a
    _transport_ condition a sample cannot hold — a dead socket, a non-JSON body, an extra page — is
    fine, and should reuse a recorded resource where one exists.
31. Parsing and error mapping are unit-tested against those samples (SPEC 8).

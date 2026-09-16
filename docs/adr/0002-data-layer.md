# ADR-0002: TanStack Query + hand-written JSON:API client

Status: accepted (2026-09-15)

## Context

The Productive API is JSON:API. Evaluation includes "API integration and efficiency". The handbook lists TanStack Query and Infinum's own datx (MobX JSON:API store) as state options.

## Decision

TanStack Query for server state; a small typed client (`src/api/client.ts`) that sets headers, parses `data`/`included`/`meta`, and maps `errors[]` to `ApiError`. No datx, no Redux, no global store.

## Rationale

- TanStack Query gives per-key caching, invalidation, optimistic updates and request de-duplication, which directly addresses the "efficiency" criterion (one request per day view, cache reuse when navigating back).
- A hand-written client (about 100 lines) keeps the JSON:API handling explicit and reviewable; datx would hide it behind a store abstraction with a learning curve that does not fit the budget.
- Types are derived from recorded sample responses (`docs/api/samples/`), not from the 130k-line OpenAPI file, to avoid generating thousands of unused types.

## Consequences

- Relationships are resolved manually (`included` lookup helper). Acceptable for two relationships (person, service).
- If the app grew to many resources, generating types from OpenAPI would be the next step.

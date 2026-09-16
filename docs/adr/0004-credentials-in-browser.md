# ADR-0004: Credential persistence and browser security posture

Status: accepted (2026-09-15)

## Context

R-2 requires the token and organization ID to survive a page refresh and to be cleared on logout. No server-side code is allowed, so the token necessarily lives in the browser.

## Decision

- Persist `{ token, organizationId }` in `localStorage` under a single namespaced key; derived session data (personId, defaultServiceId) stored alongside and re-validated on app start with one `GET /organization_memberships` call.
- Never write the token into URLs, logs, error reports or the query cache keys.
- Logout removes the key and clears the TanStack Query cache.
- No `.env` token in the build; the sample `.env.example` contains only the API base URL.

## Rationale

- `localStorage` matches the "page refresh keeps the user logged in" requirement; `sessionStorage` would log the user out on a new tab, which contradicts the expectation of a tracker used daily.
- The realistic risk is XSS; mitigations within scope: React's default escaping, no `dangerouslySetInnerHTML`, no third-party scripts, a strict CSP meta tag, dependency audit in CI.

## Consequences

- A malicious extension or XSS could read the token. The production-grade alternative is a backend-for-frontend or proxy holding the token (handbook SSO chapter); explicitly out of scope by assignment rules and documented as the next step.

# ADR-0007: TanStack Router instead of React Router

Status: accepted (2026-09-15)

## Context

Two routes carry state in the URL: `/day/:date` (the selected day is the primary navigation concept) and `/entries/new?date=`. The edit screen must be its own route (R-11). TanStack Query is already in the stack (ADR-0002). Candidates: React Router 7 (library mode) and TanStack Router.

## Decision

TanStack Router, file-based routes via the Vite plugin.

## Rationale

- Type-safe params and search params: `date` is validated with a zod schema at the route boundary, so an invalid or missing date redirects to today in one place instead of being checked in components. React Router treats `useParams`/`useSearchParams` as untyped strings.
- `beforeLoad` route guard with typed router context carries the session; unauthenticated access to any protected route redirects to `/login` declaratively, and `/login` redirects to today when a session exists.
- Loaders integrate with TanStack Query (`queryClient.ensureQueryData`) so the day view and the edit view start fetching on navigation, not after mount; this is the "efficiency" criterion made visible.
- Typed `<Link to="/day/$date">` catches broken links at compile time; useful when Claude Code generates routes.
- Cost: a newer API than React Router. Mitigated by the small route count (5) and by keeping routing thin: routes only validate, guard, prefetch and render a feature component.

## Rejected: React Router 7

Perfectly capable and more familiar, but it would leave date validation, auth redirects and prefetching as ad-hoc code in components. For a reviewer judging architecture, the router-boundary approach is the stronger demonstration.

## Consequences

- `src/routes/` follows TanStack file conventions (`__root.tsx`, `day.$date.tsx`, `entries.$id.edit.tsx`); route tree is generated (`routeTree.gen.ts`, committed).
- Devtools enabled in development only.

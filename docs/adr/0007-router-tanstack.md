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
- Typed `<Link to="/day/$date">` catches broken links at compile time.
- Cost: a newer API than React Router. Mitigated by the small route count (5) and by keeping routing thin: routes only validate, guard, prefetch and render a feature component.

## Rejected: React Router 7

Perfectly capable and more familiar, but it would leave date validation, auth redirects and prefetching as ad-hoc code in components. For a reviewer judging architecture, the router-boundary approach is the stronger demonstration.

## Consequences

- `src/routes/` follows TanStack file conventions (`__root.tsx`, `day.$date.tsx`, `entries.$id.edit.tsx`); route tree is generated (`routeTree.gen.ts`, committed).
- Devtools enabled in development only.

## Amendment (US-1, 2026-09-16): the day loader prefetches rather than awaiting

The Rationale above names `queryClient.ensureQueryData`. `/day/$date` ships with
`queryClient.prefetchQuery`, not awaited.

The goal that motivated the loader - start fetching on navigation rather than after mount - is met
either way. Awaiting is what the design rules out: the day screen specifies a skeleton **under a
usable date navigator** (`02-day-mobile-loading.png`) and an inline `Retry` that leaves the rest of
the screen alone (`02-day-mobile-error.png`). An awaited loader holds the route on a blank screen
until the request lands, and hands a failure to the router's `errorComponent`, which replaces the
whole page and cannot offer a retry scoped to the list.

So the route starts the request and the component subscribes to the same query key, which is what
renders the four list states in place. `ensureQueryData` remains the right call for
`/entries/:id/edit` (US-3), where there is nothing to render until the entry is known.

## Amendment (2026-09-18): the form loaders fetch rather than ensure

`ensureQueryData` hands back whatever is in the cache however old it is - that is its contract, and
it has no bearing on staleness. For `/entries/:id/edit` that meant an entry changed in Productive
itself, or in another tab, opened a form on the values from before the change; `/entries/new` had the
same hole in the entry a duplicate starts from.

Both now call `queryClient.fetchQuery`, which honours the client's `staleTime` (30s): reopening a
form straight after closing it still costs no request, and anything older is read again. The decision
above is unchanged - the loader still starts the request on navigation and the edit route still awaits
it, because there is nothing to render until the entry is known.

The two hooks that `removeQueries(['time-entry', id])` after a write still need to: 30 seconds is
long enough for a save or a delete to be handed back the copy it replaced.

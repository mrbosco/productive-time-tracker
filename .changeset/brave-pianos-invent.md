---
'tracktive': minor
---

Add the Productive JSON:API client layer: a fetch wrapper with JSON:API parsing and `ApiError`
mapping, typed resource modules for organization memberships, time entries, services and timers,
and MSW handlers built from responses recorded into `docs/api/samples/`.

No user-facing behaviour yet - stories consume these through hooks in `components/features/`.

---
'tracktive': patch
---

Serve a day's entries from the week already loaded, and validate what the API sends back.

The day list and the week strip were two requests to `GET /time_entries` with identical `fields` and
`include`, differing only in the range - so the day was always a subset of a request already being
made, and every create, edit and delete invalidated both. A day is now a selection over the one
cached week: a cold day view costs four requests instead of five, and stepping between days inside a
loaded week costs none instead of one.

Responses are also parsed rather than trusted. `JSON.parse` returned `any` and the readers below it
turned a changed shape into a plausible value, so a `time` that stopped being a number would have
rendered as `0h` among real durations. The envelope and the four time-entry attributes the app reads
are validated, and a shape that does not match raises the same error the UI already shows.

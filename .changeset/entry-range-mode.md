---
'tracktive': minor
---

Log an entry by when it started and when it ended.

A toggle under the fields swaps Duration for a From and a To, and the same `= 1h 30m` preview shows
what the pair comes to before you save. An end that is not after its start is a validation error
rather than a span across midnight, and both ends are required once the toggle is on.

Only the minutes are stored, which is all Productive keeps: an entry logged as 09:00 to 10:30 is an
entry of `1h 30m`, and reopening it shows `1h 30m` rather than the times it was typed from.

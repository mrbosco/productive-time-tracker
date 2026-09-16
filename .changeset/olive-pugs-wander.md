---
'tracktive': minor
---

Add the day view: the time entries logged on a selected date, and the week around it.

Signing in now lands on `/day/<today>` rather than a placeholder, and the date lives in the URL, so
a day can be linked, refreshed and stepped through. Only the signed-in person's entries are listed,
and they read in the order they were logged.

Each entry shows its duration as `1h 30m`, its description and the service it was tracked against.
Descriptions written in Productive's rich-text editor arrive as text with their line breaks intact,
and a long one is clamped to three lines behind More. A zero-minute entry is shown as `0h` rather
than skipped, because Productive writes them.

A week strip sits above the list with what was logged on each of the seven days and the week's own
total, from a single request. A past workday with nothing on it reads as a dash rather than `0h`,
so an empty day you meant to fill is visible at a glance. On desktop the day also breaks down by
service beside the list.

Move between days with the previous and next buttons, any cell of the week strip, a calendar the
date label opens, or the Today shortcut. A day with nothing on it says so and offers Add entry; a
day that fails to load says that instead and offers Retry, leaving the date navigation usable so
another day is still one tap away.

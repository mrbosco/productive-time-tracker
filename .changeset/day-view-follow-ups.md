---
'tracktive': minor
---

Nine fixes from a pass over the app with fresh eyes.

Switching between Day and Timesheet keeps the day you were on, instead of dropping you on that
week's Monday and leaving you there when you switched back. Opening the entry form no longer scrolls
the page to the top or replays the day's entrance animation — the form is a modal over a day that
should stay exactly where it was. `Copy from yesterday` now names the day it will copy, because on a
Wednesday "yesterday" is not the same thing as it is on a Monday. `Log time` waits until something
has been typed, since with an empty box it only did what `Add entry` already does.

The timesheet's editable cells are gone. A cell is the total of however many entries share a service
and a day, so typing over it had no answer to "onto which entry?" — the old code quietly adjusted
the most recent one. The cell now links into that day, where entries are individually editable.

Also: the row's hover play button no longer appears at narrow widths, where it had nowhere sensible
to sit and the entry menu already offers `Continue timer`; and the browser tab finally carries the
brandmark and the app's real name.

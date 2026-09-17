---
'tracktive': minor
---

Duplicate an entry, and fill an empty day from the day before it.

`Duplicate` in a card's menu opens a new entry starting from that one's duration and description,
dated today rather than the day it was copied from — most of the time the point of copying
yesterday's standup is logging today's, and the original day is still one tap away in the picker.
Nothing is saved until you save it.

An empty day now offers `Copy from yesterday` beside `Add entry`. It writes yesterday's entries onto
this day one at a time, each with the duration, description and service it had, and reports what
happened in one message: how many were copied, and how many were refused. An entry that fails does
not stop the ones after it.

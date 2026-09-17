---
'tracktive': minor
---

Finish the entry row's actions: `Undo` instead of a confirm, and the keys the design puts on a row.

Correcting a duration now says so twice - a quiet `Saved` on the row for a couple of seconds, and a
toast that keeps an `Undo` in reach for eight. That is what makes the inline field safe without a
confirm dialog, which would cost more than the trip to the edit screen it replaces.

On a focused row, `Enter` opens the duration field and `p` starts the timer on that entry; both are
in the `?` sheet. Starting a timer on an entry from another day now says which day it is counting
onto, because the timer attaches to the entry rather than making a new one today.

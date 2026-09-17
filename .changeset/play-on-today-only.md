---
'tracktive': patch
---

Only offer to continue a timer on today's rows.

The play button appeared on every row at every date, and `p` did the same. A timer attaches to the
entry it is started from rather than making a new one, so playing yesterday's row started a clock
counting into yesterday - which is not a thing a running timer can sensibly be. Both are today's
now, on the row and in the kebab.

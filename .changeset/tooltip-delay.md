---
'tracktive': patch
---

Wait for a deliberate hover before opening a project's context or a day's hours.

Both panels opened after 200ms, which is short enough that sweeping the pointer across the day to
click something fires them on the way past. They are supplementary detail nobody is waiting on, so
they now wait two seconds for a hover that means it.

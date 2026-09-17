---
'tracktive': patch
---

Make the quick-add line's `Start` actually work.

What you typed never reached the entry - the timer started, the row appeared blank, and stopping it
left nothing to recognise. The description is written onto the entry now, as it was meant to be.

Starting also takes you to the day the work landed on. A timer files its entry on today, so starting
one while looking at another day recorded it correctly and then showed you nothing.

And starting a second timer no longer refuses. It retires the one already running, which keeps its
tracked time on its own entry, and begins the new one - which is what moving on to the next thing
means. The hint under the row says so before you press it.

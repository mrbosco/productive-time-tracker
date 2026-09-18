---
'tracktive': patch
---

Stop the day's entries animating in when a dialog opens over them.

The entry form is its own route rendering its own copy of the day underneath, so opening `Add entry`
or `Edit` unmounted one day view and mounted another - and the list's per-row entrance replayed each
time, which read as the day reloading when nothing about it had changed. The rows now animate on the
same signal the rest of the day already used: the day arriving, not the component mounting. Stepping
between days is unchanged.

That signal is also no longer spent by the loading skeleton, so on a cold day the rows keep the
entrance the skeleton used to consume.

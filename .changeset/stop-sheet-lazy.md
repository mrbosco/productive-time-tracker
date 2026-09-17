---
'tracktive': patch
---

Stop the day view downloading the rich-text editor it does not use.

The stop-timer sheet writes rich text, and it is mounted in the app bar, so the editor's 392 kB were
being pulled onto every screen behind the login — including the day view, which does not have a
description field on it. The sheet is fetched when a timer stops instead.

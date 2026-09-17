# tracktive

## 0.3.0

### Minor Changes

- c4add57: Notice when a timer is running and nobody is there.

  After fifteen minutes with no sign of anyone — no mouse, no keys, no scrolling, no clicks — a running
  timer raises a quiet amber note above the day: the timer is running, and this is how long it has been
  since anything happened. It offers two answers and takes neither on its own. `Keep running` says you
  are here and restarts the clock. `Pause and discard idle time` stops the timer and opens the usual
  save sheet with those minutes already taken off, stated plainly and still editable, so nothing is
  decided for you.

  It is a guess and is treated as one. It never counts time while the tab is in the background, where
  no input arrives at all and everyone would look idle. Nothing is sent anywhere, no timer is ever
  stopped by itself, and the watching only exists while a timer is running.

  There is also a heuristic for input that looks automated rather than human — regular as a metronome
  and barely moving. It is written, tested, and **off**, because a time tracker that watches how you
  type is not one anyone should have to trust. The README explains the flag.

- 2782577: Delete a time entry, from the day view or from the edit form.

  The card's menu and the edit form's `Delete entry` both open the same question, naming the entry by
  its duration and the first line of its description so it can be answered without dismissing it.
  Nothing is deleted until it is.

  From the day view the entry leaves the list the moment the question is answered, and the day summary
  and week strip drop by its minutes with it; the confirmation appears on the day rather than sending
  you anywhere. If the delete fails, the entry comes back where it was and the screen says why. From
  the edit form the failure is reported on the form itself, beside the values, and the form stays open.

- c4add57: Duplicate an entry, and fill an empty day from the day before it.

  `Duplicate` in a card's menu opens a new entry starting from that one's duration and description,
  dated today rather than the day it was copied from — most of the time the point of copying
  yesterday's standup is logging today's, and the original day is still one tap away in the picker.
  Nothing is saved until you save it.

  An empty day now offers `Copy from yesterday` beside `Add entry`. It writes yesterday's entries onto
  this day one at a time, each with the duration, description and service it had, and reports what
  happened in one message: how many were copied, and how many were refused. An entry that fails does
  not stop the ones after it.

- c4add57: Log an entry by when it started and when it ended.

  A toggle under the fields swaps Duration for a From and a To, and the same `= 1h 30m` preview shows
  what the pair comes to before you save. An end that is not after its start is a validation error
  rather than a span across midnight, and both ends are required once the toggle is on.

  Only the minutes are stored, which is all Productive keeps: an entry logged as 09:00 to 10:30 is an
  entry of `1h 30m`, and reopening it shows `1h 30m` rather than the times it was typed from.

- c4add57: Drive the day from the keyboard.

  `n` opens the entry form, `←` and `→` step a day at a time, `t` returns to today, and `?` opens a
  sheet listing all of it — from the app bar's `?` button too. Inside the list, `↑` and `↓` move
  between entries, `e` edits the one you are standing on and `Delete` asks before removing it, which
  is the same question the card's menu asks.

  Entries are now reachable by keyboard at all: the list has one tab stop rather than one per card,
  so Tab reaches it and the arrow keys move within it. Every shortcut goes quiet while a field, the
  description editor, a dialog or an open menu has focus, so typing an `n` into the quick-add line
  types an `n`.

- c759c53: Add the login screen and the session it creates.

  Enter a Productive API token and organization ID to sign in. The person behind the token is
  resolved from the API rather than typed, and the credentials are kept in this browser so a refresh
  keeps you signed in; the account menu's Log out removes them and clears everything cached for them.

  Failed sign-ins say which thing is wrong: a rejected token, a token with no person in that
  organization, and an unreachable API each read differently. Every screen now sits behind the
  session, so opening one without signing in lands on the login screen instead.

  The screen is built from the design source rather than from its exports, so the brand mark,
  type sizes, control heights, alert treatment and icons match it exactly.

- c4add57: Show a day's entries newest first.

  The list was ordered by when each entry was logged, oldest at the top, so anything you added went to
  the bottom — below everything already there, and off the screen on a full day. Starting a timer made
  it plain: the row it creates is the one you want to see, and it appeared last.

  The day now reads newest first. A new entry, and a timer's, arrive at the top. Editing an entry
  leaves it where it is, because editing does not make it new, and copying a day forward still lands
  in the same order it was logged in.

- ec2acbe: Add a time entry, from the day you are looking at.

  The form takes three things: the date, prefilled from the day you came from and changeable in the
  calendar; a duration; and an optional description. Duration is typed however you think about it -
  `1h 30m`, `1:30`, `1.5h` or plain `90` all mean ninety minutes - and a live `= 1h 30m` beside the
  field shows what will be saved before you commit to it. Saving returns you to the day the entry
  belongs to, with the entry in the list, the day and week totals brought up to date, and a short
  confirmation.

  Nothing is flagged as wrong while you type. Press Save and the field says what is actually wrong -
  missing, unreadable, zero, or longer than a day - in place of the hint rather than below it. If
  Productive refuses the entry, the form keeps everything you wrote and says why.

  The service each entry is logged against is now yours to pick, from the account menu or from the
  form itself. It is remembered in this browser and used for new entries and, later, the timer.

  On a phone the form is a full screen with the buttons pinned to the bottom; on a desktop it is a
  dialog over the day, which stays visible behind it.

- 1fc59ce: Add the day view: the time entries logged on a selected date, and the week around it.

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

- 5b23ad7: Edit a logged time entry, from the menu on its card.

  `Edit` on a card opens the entry in the same form that creates one, prefilled and at its own
  address, so it survives a refresh and can be shared or bookmarked. Change the duration, the
  description, the date, or all three; `Save changes` returns you to the day the entry ends up on -
  which is the new day if you moved it - with the list, the day total and the week strip all brought
  up to date. Moving an entry to another date takes it off the day it was on rather than leaving a
  copy behind.

  A description written in Productive as a list arrives as that list and is saved back as one.
  Formatting survives the round trip instead of being flattened to plain text, so editing an entry in
  Tracktive no longer costs you the way it was written elsewhere.

  The service an entry is logged against stays the one it already had. The form names it, but editing
  never reassigns it - the default service you pick in settings applies to new entries, not to
  existing ones.

  Opening an entry that has since been deleted says so plainly and offers a way back to today, rather
  than failing silently or blaming the network. If the save itself fails, the form keeps everything
  you wrote and says why.

  On a phone the form is a full screen with the buttons pinned to the bottom; on a desktop it is a
  dialog over the day, which stays visible behind it.

- f6312bb: Write descriptions the way Productive does.

  The description field is a real editor now. Start a line with `- ` and it becomes a bullet list,
  `1. ` an ordered one, and Ctrl/Cmd+B, Ctrl/Cmd+I and Ctrl/Cmd+Shift+S bold, italicise and strike
  the selection. What
  you write is stored as the same HTML Productive's own editor produces, so an entry written here
  opens unchanged there.

  Entries written in Productive read correctly too. A description saved as a list is drawn as a list
  on the day view instead of being flattened to a line, and opening one to edit no longer quietly
  throws its formatting away on save.

  Nothing from the API is ever trusted as markup: the card renders an allowlist of tags as elements
  and drops everything else, and the editor keeps only what its own schema defines, so a note
  carrying a script tag arrives as prose.

- c4add57: Track time as it happens, with a timer in the app bar.

  `Start timer` runs against your default service and shows the elapsed time on every screen, in the
  bar and in the browser tab, so a timer left running in a background window is still visible. It
  survives a refresh: the running indicator is back before the app has finished asking the API about
  it. `s` stops it from anywhere, and so does the pill itself.

  Starting a timer puts its entry on today immediately, as `0h`, because that is what Productive does
  — the timer and the entry are one thing. Stopping opens a sheet with the tracked minutes and the
  time it ran, where the duration can be corrected and the work described; saving edits that entry
  rather than adding a second one, and `Discard` removes it. A timer stopped inside a minute really
  does come back as `0h`, since whole minutes are all that is stored, which is why the duration is
  editable there.

  The row a timer is running against says so: an indigo edge, a `Tracking` label beside a breathing
  dot, a duration that counts up live, and a stop control of its own — the app bar can be scrolled a
  long way from it on a full day, and both stop the same timer.

  An entry's menu gains `Continue timer`, and it is a real continuation: the timer attaches to that
  entry, so the row you clicked is the row that counts up — on its own day, from the time it already
  holds — and stopping adds to it rather than leaving a second entry beside it. Discarding a
  continuation puts the entry back to what it held; discarding a timer you started from the bar
  deletes the entry it created. Only one timer runs at a time, so the item is greyed out while one is
  going.

### Patch Changes

- c4add57: Stop the description placeholder sitting underneath what you type.

  "What did you work on?" stayed on screen behind the first word written into a description, so the
  two overlapped. It was most visible on the stop-timer sheet, but the same field is on the entry form
  and could show it there too.

- c4add57: Stop the day view downloading the rich-text editor it does not use.

  The stop-timer sheet writes rich text, and it is mounted in the app bar, so the editor's 392 kB were
  being pulled onto every screen behind the login — including the day view, which does not have a
  description field on it. The sheet is fetched when a timer stops instead.

- c4add57: Say so when a timer will not start or stop.

  A start, a continue or a stop that the API refused did nothing visible at all — no message, and the
  pill simply unchanged. Each now reports itself on the day, the same way a failed delete does.

  Arrow keys also belong to the entry list rather than to the page: they move between entries once the
  list has focus, and scroll the day normally before that.

- c4add57: Keep the selected day visible in the week strip on a phone.

  The strip holds seven days and the week's own total, which is wider than a phone screen, and it
  always started at Monday. Choosing a Friday or a Sunday scrolled the day you had just picked off
  the right edge, so the week around it was on screen and the day itself was not.

  The selected cell is now brought into view whenever the day changes, and centred where there is
  room for it. Nothing changes on a wider screen, where all eight cells fit side by side already.

## 0.2.0

### Minor Changes

- b1e17dd: Add the Productive JSON:API client layer: a fetch wrapper with JSON:API parsing and `ApiError`
  mapping, typed resource modules for organization memberships, time entries, services and timers,
  and MSW handlers built from responses recorded into `docs/api/samples/`.

  No user-facing behaviour yet - stories consume these through hooks in `components/features/`.

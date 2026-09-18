# tracktive

## 0.4.0

### Minor Changes

- cbed78a: A phone-first pass over the day list, the week strip and the login screen.

  On a narrow screen the day's entries are separate cards rather than rows inside one container, each
  carrying its own border and a footer that holds the date beside the duration; the company avatar and
  the inline date move to the wide layout, where there is room for them. The week strip's total leaves
  the eighth cell and becomes its own row under the strip, so the seven days get the width instead and
  the total can name what was expected next to it. The login screen gains the Productive wordmark, a
  header band and a footer that says where the credentials live, and the hint about Settings > API
  integrations now sits with the fields it describes rather than under the heading.

  Nothing about the wide layout changes.

- 10e4842: Rebuild the entry row's actions to the approved desktop design, and fix what was reported.

  The duration is now a proper field where it sits — 112px, right-aligned, with the parsed result and
  the nudge chips in a panel beneath it, its text selected on open so typing replaces rather than
  appends. It refuses what the entry form refuses, in the same words, and Escape puts the original
  back. Saving is optimistic, so the number changes at once instead of after a round trip. The play
  button and the pencil now reserve their space at rest, so hovering a row no longer shifts the
  column.

  Both are a pointer's affordances: touch keeps `Continue timer` and `Edit` in the kebab, because
  there is no hover to reveal a control and no room for a field beside the note.

  Also fixed: the default-service search had two clear crosses and would not visibly change the
  default when you picked one; the day's quick-add row vanished while the day reloaded around it; the
  hover panels now open after a second on the week strip and straight away on a project name; the
  timesheet lost its `Add row` and its per-cell count, and its totals sit on the middle of their rows.

- 10e4842: Lead each entry with the company its time is billed to.

  An entry card said what was done and which service it went against, but not who it was for - and
  the company is the first thing anyone scanning a day looks for. It now sits at the leading edge as
  a logo, or the company's initials when it has none, or a building when the service has no company
  at all. Two entries for the same client read as a pair without a word being read.

  The duration moves to the trailing edge to make room, where it lines up on its own right edge
  rather than on a reserved column, and where the play button that is coming next will sit beside it.

  It costs no extra request: the project, its company, the deal, the client and the section all nest
  inside the one call the day already makes.

- 2f1583b: Nine fixes from a pass over the app with fresh eyes.

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

- 10e4842: Type what you are about to do, and start the clock on it.

  The quick-add line only ever opened the entry form. It now leads with `Start`, which begins tracking
  against your default service straight away and writes what you typed onto the entry as its
  description - the row appears in the day immediately, counting. `Log time` is still there, quietly,
  for work already done, and opens the form with the same text filled in.

  It starts nothing while a timer is already running, and says so rather than silently beginning a
  second one.

- 10e4842: Say what was expected of a day, not only what was logged on it.

  Hovering a day in the week strip, or its total, now shows expected work time, worked time and what
  is left of the first after the second. The same numbers are in each cell's accessible name, so a
  phone and a screen reader get them too.

  The strip also stops guessing at non-working days. It used to hatch the weekend; it now hatches
  whatever the person's own working hours say is a day off, which finally sees a four-day week. Where
  an account has never set any hours, the weekend is still the fallback and the numbers stay hidden
  rather than claiming nothing was expected.

  It costs no request: the figure rides the membership call made at login.

- 10e4842: One clock, a pointer on everything clickable, and three smaller corrections.

  A running timer now reads the same in all three places it appears - the app bar, the timesheet's
  header pill, and the cell it is running in. Two of those were showing something else entirely: the
  entry's stored total and the day's sum, so a timesheet with a timer on it printed three different
  durations and left you to work out which one was the clock.

  It is also written in units now - `23s`, `9m 20s`, `1h 9m 20s` - because `9:20` on a timer and `9h 20m` on
  the card below it are the same glyphs meaning wildly different amounts of time.

  Every clickable thing has a pointer cursor again. Tailwind 4 leaves a `<button>` with the arrow
  where v3 gave it a hand, and menu items shipped with `cursor-default` on top of that.

  Also: the play button moved to the left of the duration, so the space it reserves at rest is
  absorbed by the note rather than left as a hole beside the kebab; a tracking row's indigo edge is a
  border rather than a bar, so it follows the row's rounded corners instead of poking out square; and
  the quick-add row drops `Start` on any day but today, where a timer cannot sensibly run.

- 10e4842: Show which organization you are logged into, before you log anything into it.

  The app bar's avatar now wears a badge carrying the organization's logo, and the account menu names
  the organization beside the ID that was typed at login. Someone who works across two organizations
  could previously only tell them apart by logging out and reading the login screen.

  Avatars are real pictures now rather than initials. The person's own comes from their Productive
  profile and the organization's from the company behind it, both on the request login already makes;
  initials stand in for anyone who has not uploaded one, and for a logo whose file has since gone.
  The accent tint goes with them: it exists to sit behind two letters, and a logo brings its own
  colours. An uploaded picture sits on a neutral plate with a hairline instead, so a transparent mark
  still has an edge and still reads as being in the circle.

  The avatar grew from 32px to 40px with it, and stopped shrinking on desktop, where there is more
  room rather than less. It matches the timer control and the shortcuts button on that row, which are
  both 40px.

- 10e4842: Start a timer from a row, and correct its time without leaving the day.

  `Continue timer` has left the card menu for a play button on the row itself, one tap instead of
  two. The duration beside it opens a small editor in place, with a pencil that appears on hover and
  is always there on touch: type a new one, nudge it by a quarter hour or an hour, Enter saves and
  Escape cancels. Correcting logged time is the most common edit there is, and it used to cost a trip
  to the edit screen and back.

  It accepts exactly what the entry form accepts and refuses it in the same words, because it now
  uses the form's own rules rather than a second copy of them. A row with a timer running on it keeps
  its duration as plain text - the number is moving, and an editor seeded from a moving number would
  save whichever value it happened to open on.

- 10e4842: Name the project on every entry, and put the rest of its context one gesture away.

  A card said which service the time went against and nothing else, so two entries for different
  clients read the same. The meta line is now `project · service`, and the project name opens what
  sits behind it: the client when it is somebody other than the company on the avatar, the deal, and
  the section.

  It opens as a dark panel on a pointer and as a sheet on touch, because hover is not something a
  phone has. Either way it is a real button that answers the keyboard, and rows with nothing in them
  are left out rather than filled with a dash.

  The default-service picker moves with it. Its label has always read "Company · Project · Service"
  while printing the deal in the middle - a different record, often with a phase or a year appended.
  It names the project now, and falls back to the deal only where a service was never filed under
  one.

- 10e4842: Make the default service findable.

  The sheet held a native dropdown, which is fine with a handful of services and unusable with
  eighty: it cannot be searched, it cuts long labels off mid-word at the width of the control, and it
  has no room for a logo or a second line.

  It is a searchable list now, grouped by company with the company's logo on each group header. The
  service name leads and its project sits underneath, so nothing truncates. Search spans company,
  project and service together, so "dev" finds every development service and a company name narrows
  to one client. Your current default sits first in its group, anything you have tracked in the last
  month is marked `Recent` and follows it, and your own organization's services lead the list.

  Choosing applies immediately — `Done` only closes, and on a phone a tap does both at once.

- 10e4842: Show how an entry's time was arrived at.

  Tracked time is timer runs plus whatever was typed by hand, and a card only ever showed the result.
  `Timer logs` in the entry menu opens a read-only account of it: every run with its start, its stop
  and what it added, and a footer reconciling what the clock tracked, what was corrected by hand, and
  what is actually logged. Which is the conversation to have before an invoice is disputed, not after.

  It took the place `Continue timer` left when that moved onto the row, so the menu did not grow.

- 10e4842: Add a timesheet: a whole week of logged time in one grid.

  A second view beside the day, reached by a `Day | Timesheet` switch in the app bar — or `w` and `d`.
  One row per project and service, one column per day, every cell editable where it sits: click it,
  type `1h 30m` or `90`, Enter saves. Today's column is washed, days you are not expected to work are
  hatched, and a running timer fills its own cell with a stop button.

  `Add row` picks a project and service from the same searchable list the default-service sheet uses.

  Desktop only, deliberately: nine columns are unreadable on a phone, so the switch is hidden there
  and the day view remains the answer.

- 10e4842: Finish the entry row's actions: `Undo` instead of a confirm, and the keys the design puts on a row.

  Correcting a duration now says so twice - a quiet `Saved` on the row for a couple of seconds, and a
  toast that keeps an `Undo` in reach for eight. That is what makes the inline field safe without a
  confirm dialog, which would cost more than the trip to the edit screen it replaces.

  On a focused row, `Enter` opens the duration field and `p` starts the timer on that entry; both are
  in the `?` sheet. Starting a timer on an entry from another day now says which day it is counting
  onto, because the timer attaches to the entry rather than making a new one today.

- 10e4842: A visual pass over the day, the week strip and the timesheet.

  The day gets a heading and a count instead of one summary line, entries sit in a single card with
  dividers rather than as separate boxes, and the right-hand column becomes a dark day-overview panel
  carrying the total against what was expected. The week strip's cells are taller, the selected one is
  filled rather than underlined, and each carries a small bar of how much of the day is logged. The
  service name on a row is a chip beside the project rather than a dot-separated continuation of it,
  and the app bar names the person beside their avatar on a wide screen.

- 10e4842: Tell the week strip's cells apart.

  Every cell used to be drawn the same way, including the week total, which is not a day and cannot
  be navigated to. A day nobody is expected to work now carries a hatched fill and a dashed border,
  and the total sits in the selection wash as a panel with no border, no hover and no tab stop, over
  the label it needed: `= 10h`, `Weekly total`.

  The dash and the zero swapped meanings with it. A dash now means no work was expected on that day
  and `0h` means it was and none of it is logged, which is the distinction the strip was missing - a
  Saturday and a Tuesday you forgot to fill in used to look identical. The selected day takes the
  tint the design system had been reserving for it all along, rather than resting on a 3px rule that
  is easy to mistake for a neighbour's border.

### Patch Changes

- cbed78a: Offer to copy the last day that was worked, not whichever day happens to be before this one.

  An empty Sunday offered to copy Saturday, and on an empty Saturday that is an offer to copy nothing -
  the day worth copying was Friday. The empty state now names the most recent day in the week on screen
  that has time on it, and the copy takes that day. The week is already loaded for the strip, so this
  costs no request; a week with nothing earlier in it still offers the day before, as before.

- cbed78a: Stop the day's entries animating in when a dialog opens over them.

  The entry form is its own route rendering its own copy of the day underneath, so opening `Add entry`
  or `Edit` unmounted one day view and mounted another - and the list's per-row entrance replayed each
  time, which read as the day reloading when nothing about it had changed. The rows now animate on the
  same signal the rest of the day already used: the day arriving, not the component mounting. Stepping
  between days is unchanged.

  That signal is also no longer spent by the loading skeleton, so on a cold day the rows keep the
  entrance the skeleton used to consume.

- 10e4842: Stop a focus ring being left behind on whatever opened a menu or dialog.

  Closing an overlay by clicking outside it drew an accent ring on the control that had opened it -
  the account menu, an entry's actions, the delete confirmation, the date picker - with nothing on
  screen to explain why that control was suddenly outlined.

  Returning focus to the trigger is correct and stays: without it, dismissing a dialog would drop a
  keyboard user at the top of the document. What was wrong is that the ring came with it. Chrome
  counts every focus moved by code as keyboard-driven, so the ring appeared whether or not a keyboard
  was involved. It is now suppressed while the last thing the user did was point, and the next key
  press brings it straight back. Text fields keep theirs either way.

- cbed78a: Stop the day jumping to the top when the entry form closes.

  Opening the form already left the day exactly where it was, but every way back out of it - Cancel,
  Escape, the backdrop, the close icon, a save, a delete - navigated without saying so, and the router
  reset the scroll position. A day read halfway down snapped to the top on close. Saving an entry whose
  date changed still lands at the top of the new day, which is the one case where the day underneath is
  not the day you were reading.

- 2f1583b: Serve a day's entries from the week already loaded, and validate what the API sends back.

  The day list and the week strip were two requests to `GET /time_entries` with identical `fields` and
  `include`, differing only in the range - so the day was always a subset of a request already being
  made, and every create, edit and delete invalidated both. A day is now a selection over the one
  cached week: a cold day view costs four requests instead of five, and stepping between days inside a
  loaded week costs none instead of one.

  Responses are also parsed rather than trusted. `JSON.parse` returned `any` and the readers below it
  turned a changed shape into a plausible value, so a `time` that stopped being a number would have
  rendered as `0h` among real durations. The envelope and the four time-entry attributes the app reads
  are validated, and a shape that does not match raises the same error the UI already shows.

- 10e4842: Only offer to continue a timer on today's rows.

  The play button appeared on every row at every date, and `p` did the same. A timer attaches to the
  entry it is started from rather than making a new one, so playing yesterday's row started a clock
  counting into yesterday - which is not a thing a running timer can sensibly be. Both are today's
  now, on the row and in the kebab.

- 10e4842: Make the quick-add line's `Start` actually work.

  What you typed never reached the entry - the timer started, the row appeared blank, and stopping it
  left nothing to recognise. The description is written onto the entry now, as it was meant to be.

  Starting also takes you to the day the work landed on. A timer files its entry on today, so starting
  one while looking at another day recorded it correctly and then showed you nothing.

  And starting a second timer no longer refuses. It retires the one already running, which keeps its
  tracked time on its own entry, and begins the new one - which is what moving on to the next thing
  means. The hint under the row says so before you press it.

- cbed78a: Read the entry a form opens on, rather than whatever the cache still holds.

  `ensureQueryData` returns cached data however old it is, so an entry changed in Productive itself, or
  in another tab, opened the edit form on the values from before that change - and a duplicate started
  from them. Both form loaders now use `fetchQuery`, which honours the client's 30-second staleness:
  reopening a form straight after closing it still costs no request, and anything older is read again.

  An inline duration correction also cancels any week fetch already in flight before it writes, the way
  deleting already did - an answer landing afterwards put the old number back. Its rollback now restores
  that one duration instead of the whole week as it was, so a row deleted while the correction was in
  flight no longer reappears when the correction fails.

- cbed78a: Refetch the week after a failed duration edit, not only a successful one.

  The optimistic write cancels whatever week fetch is in flight before it writes, and a cancel reverts
  rather than resumes - so a first fetch dropped there had nothing left to finish it, and invalidating
  on success alone left a day behind a failed save on its loading skeleton until the route changed. The
  duration restored by the rollback was also of unknown age and was never read again. Both weeks are
  now invalidated after either outcome, which is what deleting has always done.

  The week total also carries a role that can hold its accessible name. Its two children are hidden
  from assistive technology and ARIA forbids naming a bare `div`, so the label was being dropped and
  the total reached a screen reader as nothing at all. The login wordmark goes back to an empty `alt`:
  the heading underneath already says the name.

- 10e4842: Wait for a deliberate hover before opening a project's context or a day's hours.

  Both panels opened after 200ms, which is short enough that sweeping the pointer across the day to
  click something fires them on the way past. They are supplementary detail nobody is waiting on, so
  they now wait two seconds for a hover that means it.

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

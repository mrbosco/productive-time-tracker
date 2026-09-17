# AI workflow

How the extras in [`docs/SPEC.md`](SPEC.md) section 10 were built, and what needed correcting along
the way. SPEC 12 lists this file as a deliverable; it is written for a reader deciding how much of
the result to trust, so it records the corrections as prominently as the work.

All six shipped on one branch, `feat/extras`, one commit each, in the priority order ADR-0008 set.
Each entry below is: what was asked, what was produced, what had to be corrected, and what was left
out on purpose.

## Format

Each extra gets the same four headings. "Corrected" is the load-bearing one — it is where the
review, the browser and the live API disagreed with the first attempt, and it is not empty for any
extra that touched a real endpoint.

---

## X-1 — Week strip and totals

**Asked.** Close the gap between what X-1 shipped with US-1 and what SPEC 10 and the design brief
describe.

**Produced.** Almost nothing was missing: the three cell states, the weekly total, tap-to-navigate
and four e2e tests were already there. One real gap remained — the brief asks for "the selected cell
centered", seven 56px cells plus the week total overflow a 390px screen, and the row always started
at Monday, so choosing a Friday scrolled the day you had just picked off the edge. The strip's own
comment claimed this already worked.

**Corrected.** Nothing after the fact. The scroll is conditioned on the row actually overflowing
rather than on a breakpoint, so the desktop grid is untouched at any width.

**Left out.** The brief distinguishes a "logged (bold total)" cell from a muted `0h`; every design
export draws all three states at the same weight, and `docs/design/README.md` makes the design source
authoritative over the brief text. Raised rather than guessed at.

## X-2 — Keyboard shortcuts

**Asked.** `n`, `←`/`→`, `t`, `?`, `Esc`, roving `↑`/`↓` between cards, `e` to edit, `Delete` to
remove, `s` to stop a timer — all disabled while a field or dialog has focus.

**Produced.** One `window` listener over a map of single-key bindings, in `shared/` because the two
callers are in different trees. The guard is the load-bearing part: every binding is dropped inside
an input, the rich-text editor, a dialog or an open menu, which is also what keeps the day quiet
while the entry form renders over it. The list gained a real roving tabindex; before this, cards had
a focus ring and no tab stop, so they were unreachable by keyboard at all.

**Corrected.** Nothing after the fact.

**Left out.** `s` shipped with X-4 rather than here, because until then there was no timer to stop
and a sheet teaching a key that does nothing is worse than a short sheet.

## P-2 — Start/end range mode

**Asked.** A toggle swapping the duration field for `from`/`to`, minutes computed client-side, end
before start a validation error, editing always in duration mode.

**Produced.** `timeEntrySchema` takes the mode and returns one of two object-level transforms over
the same five fields, both producing `{ date, duration: minutes, note }` — so the submit handler and
both mutations never learn which one ran. Native `<input type="time">` rather than a picker.

**Corrected.** Nothing after the fact.

**Left out.** Nothing. The toggle is a plain button rather than `role="switch"`: its label names the
action ("Enter start and end instead"), and a switch announcing that label with `aria-checked` would
tell a screen-reader user two contradictory things.

## X-3 — Duplicate and copy from yesterday

**Asked.** A card menu `Duplicate` opening a prefilled new entry dated today, and a
`Copy from yesterday` link on an empty day running sequential creates with one toast.

**Produced.** The entry travels as an id in a search param rather than as its values, because a note
is a document and a query string is not the place for someone's writing. `useCopyDayForward` is one
mutation rather than a loop over `useCreateTimeEntry`, which would have refetched the list once per
entry while still writing to it; the POSTs are sequential so the copy reads like the day it came
from, and a refused entry is counted rather than abandoning the rest.

**Corrected.** Nothing after the fact — but the ordering change below reversed its loop: with the
newest entry at the top, posting in display order would land the new day backwards.

**Left out.** Nothing.

## X-4 — Timer

**Asked.** Start a timer for the default service from the app bar, show elapsed on every route and
in `document.title`, persist it across a refresh, stop into a prefilled form, and let a card
continue an existing entry.

**Produced.** `src/api/timers.ts` had existed unimported since the API layer landed; this is what
calls it. The design turns on SPEC 11's finding that starting a timer also creates its entry and
stopping writes the minutes onto it — so the stop sheet edits that entry rather than creating
anything.

**Corrected — four rounds, three of them things only the browser showed.**

1. **Starting a timer did nothing until the page was reloaded.** The refetch that learns the timer's
   entry inherited the client's `staleTime: 30_000` and answered from a cache still holding the
   `null` read on mount. The test harness could not have caught it: the test client used
   `staleTime: 0`, so every fetch went to the network. It now matches the app's, and reverting the
   fix fails seven tests.
2. **The running pill had no obvious control.** A dot and a square, both flat, both inside one large
   button, so the whole pill was clickable by accident. Rebuilt to `Timer.dc.html`: status left with
   no hit area, one filled 34px circle right, the ticking clock out of the button's accessible name
   because a name that changes is announced every second.
3. **`Continue timer` was implemented as a copy, on a premise that was wrong.** SPEC 10 asked for a
   continuation and it was amended *away* on the reasoning that `POST /timers` always creates an
   entry. It does not: given a `time_entry` relationship it attaches to one that already exists.
   That was settled the way api-client rule 25 says to settle these — by watching Productive's own
   client do it and recording the result in
   [`docs/api/samples/timer-continue-entry-probe.txt`](api/samples/timer-continue-entry-probe.txt),
   including that stopping **adds** to the entry's existing minutes rather than replacing them,
   measured twice. The amendment was reverted and the row records why it was wrong.
4. **`Discard` would have deleted the original entry** once continuation was real. It now puts a
   continued entry back to what it held and only deletes one the timer itself created. That was five
   hours of someone's work behind a button labelled "Discard".

**Left out.** The pill does not animate its width between states; the design's build note flags that
as needing two measured widths, and the entrance already carries the transition.

## X-5 — Activity awareness

**Asked.** Idle detection while a timer runs, gated on tab visibility, offering Harvest's two
answers; a synthetic-input heuristic behind a flag, off by default; nothing sent to the API and no
timer stopped automatically.

**Produced.** All of it. The thresholds are one configuration object taken as a parameter, which is
also how the tests reach the fifteen-minute behaviour in under a second. The heuristic requires both
regular intervals *and* near-zero movement, and answers no on too little evidence, because the cost
of a false positive is a banner accusing someone of faking a timesheet.

**Corrected — both found by assembling it rather than by testing the parts.**

1. **The banner was unreachable.** It cleared itself on any input, so moving the mouse towards it
   was a `pointermove` and it vanished under the cursor before either button could be clicked. It
   stays until answered now — which is the more honest reading anyway: "we have not seen activity
   for fifteen minutes" is a statement about the past, and being here now does not make it untrue.
2. **`useActivityMonitor` depended on its config object's identity**, so a caller passing a literal
   tore the watch down on every render and emptied the sample window — the heuristic could never
   accumulate enough to judge. The dependencies are the values now.

**Left out.** The heuristic ships off, which is a decision rather than an omission; the README says
why.

---

## Corrections that were not features

Two came out of reviewing the work rather than building it.

**The description placeholder sat underneath what you typed.** `RichTextEditor` read `editor.isEmpty`
during render, and TipTap 3's `useEditor` no longer re-renders on every transaction the way v2 did —
so it answered correctly on mount and never again. The entry form escaped it only because its first
keystroke flips react-hook-form's `isDirty`, which is a subscription by accident; even there,
emptying the field never brought the placeholder back. One fault in a shared primitive affecting
three screens, fixed where all three route through, and covered in a browser because ProseMirror
takes no input under jsdom.

**A day read oldest-first.** A-7 said `created_at` ascending, "order of logging" — right for a ledger
and wrong for a screen you work from. X-4 made it plain: starting a timer creates its row
immediately, and it appeared below everything else, off the bottom of a full day. A-7 is amended
with the reasoning rather than quietly contradicted.

**A third came out of running the production build.** `StopTimerSheet` writes rich text and is
mounted in the app bar, so TipTap - 392 kB, the cost ADR-0010 measured and accepted for one screen -
had become a static import of `_authenticated`, and every authenticated route was paying for it. The
ADR had verified the opposite by grepping the built assets; this was caught the same way. Neither
`tsc` nor either test suite has an opinion about which chunk a module lands in.

## What the tooling caught, and what it did not

The unit suite (661 tests) caught regressions in everything it covered and was silent on all four of
X-4's review findings, because each of them was either a configuration default the test harness
overrode, a question about what a control looks like, or a fact about the real API. The e2e suite
(175 tests, both viewports) was the first thing to run the features together and found six problems
in one go — five in the specs, one a harness limitation where the MSW worker forgot a running timer
across a page reload, which made X-4's persistence look broken.

`pnpm build` caught the one thing neither suite could see, and it was the last check run rather than
the first.

The lesson worth writing down: the parts were well covered and the seams were not. Every finding
above came from assembling the thing and looking at it - in a browser, against the real API, or in
the built output.

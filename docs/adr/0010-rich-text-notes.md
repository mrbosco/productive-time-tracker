# ADR-0010: TipTap for rich text notes

Status: accepted (2026-09-16)

## Context

A-9 recorded that `note` may contain HTML, because notes written in Productive's own UI go through a rich-text editor. A recorded note reads `<ul><li><p>Probavam</p></li></ul>` (`docs/api/samples/time-entries-day.json`). A-9 then decided the cheapest thing that could work: **strip the HTML to text on the way in, write plain text on the way out.**

That decision has two costs, and both are now visible in the running app:

1. **A list is not rendered as a list.** `toPlainText` flattens `<ul><li><p>Probavam</p></li></ul>` to a bare line. Productive says the entry is a list; the app draws a paragraph. R-6 asks the entry to show its description, and a description whose structure has been removed is not the one the user wrote.
2. **A list cannot be written.** The entry form is a `<textarea>`, so there is no way to start a list or bold a word. A-9 accepted the consequence in advance - "editing such an entry shows the stripped text; saving overwrites with plain text, which is documented" - and documented data loss is still data loss. **The edit form does not exist yet (US-3)**, so nothing has been degraded in practice; this is the defect US-3 would otherwise have shipped with, fixed before it can happen rather than after.

So A-9 is amended: the app now reads and writes the same rich text Productive does. This ADR records the dependency that takes, as every added dependency here does.

Three options were considered: a markdown-ish plain textarea, a hand-rolled `contenteditable`, and a real editor.

## Decision

**`@tiptap/react` + `@tiptap/starter-kit`** (which brings `@tiptap/pm`, ProseMirror, transitively), trimmed to the marks and nodes a time-entry note actually uses: paragraph, hard break, bold, italic, strike, bullet list, ordered list, list item, and history for undo. Headings, blockquote, code, code block, horizontal rule and link are turned off.

## Rationale

The deciding fact is measured, not assumed. TipTap's default schema **round-trips the recorded Productive note byte-identically**:

```
in : <ul><li><p>Probavam</p></li></ul>
out: <ul><li><p>Probavam</p></li></ul>
```

That is not a coincidence - ProseMirror's list item wraps a paragraph, and so does whatever editor Productive ships. It means the app writes the shape the API already stores, rather than a second dialect that Productive's own UI would then have to cope with. `src/components/core/RichTextEditor/RichTextEditor.test.tsx` asserts that round trip against the exported extension list, so a TipTap upgrade that changed the shape fails the suite rather than quietly starting to write a different one.

The second reason is the XSS boundary. A rich-text feature normally means "render HTML you did not write", which is the one door ADR-0004 left itself the job of keeping shut. TipTap does not open it: content is parsed **into the editor's schema**, and anything the schema does not define is discarded. Measured on the way in:

```
in : <p>hi</p><script>alert(1)</script><img src=x onerror=alert(1)>
out: <p>hi</p>
```

So the editor is also the sanitiser, and `dangerouslySetInnerHTML` still appears nowhere in the app - reading is done by mapping the parsed DOM onto React elements for an allowlisted set of tags (`src/components/features/time-entries/Note/Note.tsx`), which fails closed on anything else.

## Rejected: markdown-ish in the existing textarea

`- item` lines and `**bold**`, converted to HTML on save. No dependency, and genuinely tempting - it was the recommendation before the trade-offs were weighed.

Rejected because it is a **third dialect**. The user types markdown, Productive stores HTML, and the app owns a lossy translation between them in both directions. Round-tripping an entry written in Productive - a nested list, a link, anything the translator does not model - would degrade it on every save, which is the same silent data loss A-9 was amended to stop. It also asks the user to learn a syntax to do something their other client does with Ctrl+B.

## Rejected: hand-rolled `contenteditable`

True WYSIWYG with no dependency. Rejected on risk: selection and caret handling, paste sanitisation, undo, and the input events browsers disagree about are the substance of an editor, not the decoration. It would be the most bug-prone widget in the app and would need a test suite larger than the feature. This is the same trade ADR-0009 made for the calendar and ADR-0006 made for Radix: buy the primitive whose accessibility and input model are already tested, style it locally.

## Rejected: Lexical

The credible alternative, with a smaller core. Rejected because the matching-output argument runs the other way: Lexical's HTML export would have to be taught to produce Productive's exact `<ul><li><p>` shape, which is bespoke work to reach a place TipTap starts at. Its advantage is bundle size, and this app loads one editor on one route behind a lazy boundary, where the difference does not buy much.

## Consequences

- One new direct dependency and its ProseMirror tree, and it is not small: **390 kB raw / 123 kB gzipped**, measured from the build. That is the real cost of this decision and the main argument against it.
- It is paid only by the screen that uses it. `autoCodeSplitting` puts the whole tree in the `entries.new` chunk; the day view's own chunk is 128 kB and contains none of it, so the screen that must render on one request (SPEC 3) is unaffected. Verified by grepping the built assets, not assumed.
- If that weight ever needs to come down, the lever is Lexical or a smaller custom ProseMirror build, not a smaller TipTap - the StarterKit is already trimmed to seven nodes and marks.
- A-9 is amended rather than deleted: `note` is still nullable, still may contain HTML, and the app still never uses `dangerouslySetInnerHTML`. What changes is that the HTML is preserved instead of flattened.
- `lib/note.ts` keeps `toPlainText`, which is still the right thing for a one-line summary - the delete confirmation (US-4) and the `document.title` (X-4) both want text, not markup.
- US-3's edit form will not degrade an entry written in Productive, which removes the caveat A-9 had to document before that form exists to carry it.

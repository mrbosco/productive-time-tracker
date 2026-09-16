/**
 * A time entry's `note` is nullable and may carry HTML: notes written in Productive's rich-text
 * editor come back as markup, and a recorded one reads `<ul><li><p>Probavam</p></li></ul>`
 * (A-9, `docs/api/samples/time-entries-day.json`).
 *
 * The app renders it as text and writes plain text back. `dangerouslySetInnerHTML` is never used:
 * it is the one XSS door ADR-0004 leaves itself the job of keeping shut, and nothing here needs it.
 */

/**
 * Markup, as distinct from prose that happens to contain an angle bracket.
 *
 * Three readings were wrong before this one. Gating on `<` alone sent the app's own plain text
 * through the HTML parser, and the tokenizer reads `<` plus a letter as a tag it never finds the
 * end of: "if x<y then" came back as "if x". Gating on a tag *shape* still ate "Fixed <Button>
 * rendering". And gating on an opening tag from a closed list still ate "if a<b then c>d", because
 * `<b` is a real tag name and `[^>]*` happily swallowed " then c" up to the next `>`.
 *
 * So the test is a *closing* tag or a void element. Markup that needs stripping always has one -
 * Productive's editor emits `<p>`, `<ul>`, `<li>` pairs - and prose almost never does.
 */
const PRODUCTIVE_MARKUP =
	/<\/(?:p|div|span|ul|ol|li|a|b|i|u|s|em|strong|code|pre|blockquote|h[1-6]|table|thead|tbody|tr|td|th|script|style)>|<(?:br|hr|img)\b[^>]*\/?>/i;

/** Elements whose text content is code, not prose, and must not be rendered as the note. */
const NON_PROSE_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'TITLE']);

/** Tags whose boundaries are a line break once the markup is gone. */
const BLOCK_TAGS = new Set([
	'ADDRESS',
	'ARTICLE',
	'BLOCKQUOTE',
	'DIV',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'LI',
	'OL',
	'P',
	'PRE',
	'SECTION',
	'TR',
	'UL',
]);

/**
 * One break per boundary. Without the guard, two sibling paragraphs close and open against each
 * other and produce a blank line between every pair.
 */
function pushBreak(out: string[]): void {
	if (out.length > 0 && !out[out.length - 1].endsWith('\n')) out.push('\n');
}

function collectText(node: Node, out: string[]): void {
	for (const child of node.childNodes) {
		if (child.nodeType === Node.TEXT_NODE) {
			out.push(child.textContent ?? '');
			continue;
		}

		if (!(child instanceof Element)) continue;

		// Skipped whole, not recursed into: `<script>window.x = 1;</script>` would otherwise
		// print its body as the description. Nothing is ever executed - `DOMParser` builds an
		// inert document - but the text does not belong on the card either.
		if (NON_PROSE_TAGS.has(child.tagName)) continue;

		if (child.tagName === 'BR') {
			pushBreak(out);
			continue;
		}

		const isBlock = BLOCK_TAGS.has(child.tagName);
		if (isBlock) pushBreak(out);
		collectText(child, out);
		if (isBlock) pushBreak(out);
	}
}

/**
 * HTML to text, line breaks preserved. `null` becomes an empty string, and a note with no markup
 * is returned untouched - which is every note this app writes, so the common case never touches
 * the parser.
 *
 * `DOMParser` rather than a regex or a live element: it is the platform's own parser, it does not
 * execute scripts or fetch resources for the document it builds, and it gets nesting right where
 * a regex would not.
 */
export function toPlainText(note: string | null | undefined): string {
	if (note === null || note === undefined) return '';
	if (!PRODUCTIVE_MARKUP.test(note)) return note;

	const { body } = new DOMParser().parseFromString(note, 'text/html');
	const out: string[] = [];
	collectText(body, out);

	return (
		out
			.join('')
			// Source indentation arrives as its own text node, so a pretty-printed document would
			// otherwise contribute newlines of its own on top of the boundaries. Every run of
			// breaks collapses to one: a note is rendered as text in a card clamped to three
			// lines, where a preserved blank line buys nothing.
			.replace(/[^\S\n]*\n[\s]*/g, '\n')
			.trim()
	);
}

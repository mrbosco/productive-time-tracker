/** A time entry's `note` may carry HTML: notes written in Productive's rich-text editor come back as
 * markup, e.g. `<ul><li><p>Probavam</p></li></ul>`. This module supplies the *text* of one, for
 * callers that want a line rather than a document; rendering a note with its structure intact is
 * `components/features/time-entries/Note`. Neither uses `dangerouslySetInnerHTML`. */

/** Markup, as distinct from prose that happens to contain an angle bracket. Three narrower tests were
 * wrong before this one: gating on `<` ate "if x<y then" (the tokenizer reads `<y` as a tag it never
 * closes), gating on a tag *shape* ate "Fixed <Button> rendering", and gating on an opening tag from
 * a closed list ate "if a<b then c>d". So the test is a *closing* tag or a void element. */
const PRODUCTIVE_MARKUP =
	/<\/(?:p|div|span|ul|ol|li|a|b|i|u|s|em|strong|code|pre|blockquote|h[1-6]|table|thead|tbody|tr|td|th|script|style)>|<(?:br|hr|img)\b[^>]*\/?>/i;

/** Elements whose text is not prose and must never be rendered as the note. Exported because `Note`
 * walks the same document, and two copies drifted once already - the renderer learned about foreign
 * namespaces and this list did not, so a card claimed a description the renderer refused to draw.
 * `SVG` and `MATH` are skipped whole: inside a foreign namespace `tagName` keeps its authored case,
 * so their children arrive lower case and slip past an upper-case comparison. */
export const NON_PROSE_TAGS = new Set([
	'SCRIPT',
	'STYLE',
	'TEMPLATE',
	'TITLE',
	'IFRAME',
	'OBJECT',
	'EMBED',
	'SVG',
	'MATH',
]);

export function isNonProse(element: Element): boolean {
	return NON_PROSE_TAGS.has(element.tagName.toUpperCase());
}

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

/** One break per boundary: two sibling paragraphs would otherwise leave a blank line between. */
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
		if (isNonProse(child)) continue;

		if (child.tagName === 'BR') {
			pushBreak(out);
			continue;
		}

		const isBlock = BLOCK_TAGS.has(child.tagName.toUpperCase());
		if (isBlock) pushBreak(out);
		collectText(child, out);
		if (isBlock) pushBreak(out);
	}
}

export function containsMarkup(note: string): boolean {
	return PRODUCTIVE_MARKUP.test(note);
}

/** HTML to text, line breaks preserved. A note with no markup is returned untouched, so the common
 * case never reaches the parser. `DOMParser` rather than a regex or a live element: it builds an
 * inert document that fetches nothing, and it gets nesting right. */
export function toPlainText(note: string | null | undefined): string {
	if (note === null || note === undefined) return '';
	if (!containsMarkup(note)) return note;

	const { body } = new DOMParser().parseFromString(note, 'text/html');
	const out: string[] = [];
	collectText(body, out);

	return (
		out
			.join('')
			// Source indentation arrives as its own text node, so a pretty-printed document would
			// add newlines on top of the boundaries. Every run collapses to one.
			.replace(/[^\S\n]*\n[\s]*/g, '\n')
			.trim()
	);
}

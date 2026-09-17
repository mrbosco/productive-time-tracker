import { describe, expect, it } from 'vitest';
import { toPlainText } from './note';

describe('toPlainText', () => {
	it('returns an empty string for a null note', () => {
		expect(toPlainText(null)).toBe('');
		expect(toPlainText(undefined)).toBe('');
	});

	it('returns plain text untouched', () => {
		expect(toPlainText('Standup and time logging.')).toBe('Standup and time logging.');
	});

	it('preserves the line breaks in plain text the app itself wrote', () => {
		expect(toPlainText('First line\nSecond line')).toBe('First line\nSecond line');
	});

	/** The note actually recorded from the API (docs/api/samples/time-entries-day.json). */
	it('strips the recorded rich-text note to its words', () => {
		expect(toPlainText('<ul><li><p>Probavam</p></li></ul>')).toBe('Probavam');
	});

	it('turns block boundaries into line breaks', () => {
		expect(toPlainText('<p>First line</p><p>Second line</p>')).toBe('First line\nSecond line');
	});

	it('turns a br into a line break', () => {
		expect(toPlainText('First line<br>Second line')).toBe('First line\nSecond line');
	});

	it('keeps list items on separate lines', () => {
		expect(toPlainText('<ul><li>One</li><li>Two</li></ul>')).toBe('One\nTwo');
	});

	it('leaves inline markup inline', () => {
		expect(toPlainText('<p>Paired with <strong>Ivana</strong> on the parser.</p>')).toBe(
			'Paired with Ivana on the parser.'
		);
	});

	it('gives nested blocks one break, not one per level', () => {
		expect(toPlainText('<div><p>One</p></div><div><p>Two</p></div>')).toBe('One\nTwo');
	});

	it('ignores the indentation of a pretty-printed note', () => {
		expect(toPlainText('<div>\n  <p>One</p>\n  <p>Two</p>\n</div>')).toBe('One\nTwo');
	});

	it('decodes entities', () => {
		expect(toPlainText('<p>Fix &amp; ship &lt;today&gt;</p>')).toBe('Fix & ship <today>');
	});

	/**
	 * Plain text the app itself wrote can contain a `<`, and must survive it. Gating the parser on
	 * the character truncated the description at the first one, and gating it on a tag shape still
	 * ate `<Button>`.
	 */
	it.each([
		['Fixed <Button> rendering', 'Fixed <Button> rendering'],
		['if x<y then', 'if x<y then'],
		['5 < 6 and 7 > 6', '5 < 6 and 7 > 6'],
		['a -> b <- c', 'a -> b <- c'],
		// `<b` is a real tag name, so an opening-tag test swallowed " then c" up to the next `>`.
		['if a<b then c>d', 'if a<b then c>d'],
		['use <i> for italics', 'use <i> for italics'],
		['2 < 3 > 1', '2 < 3 > 1'],
	])('leaves %s alone, because it is not markup', (note, expected) => {
		expect(toPlainText(note)).toBe(expected);
	});

	/**
	 * The point of not using `dangerouslySetInnerHTML` (ADR-0004): a note carrying a script tag
	 * comes back as text, and its contents are never executed or rendered as markup.
	 */
	it('does not execute or emit markup from a hostile note', () => {
		expect(toPlainText('<img src=x onerror="window.stolen = 1">')).toBe('');
	});

	it('drops the body of a script or style rather than printing it as the description', () => {
		expect(toPlainText('<p>Hello</p><script>window.stolen = 1;</script>')).toBe('Hello');
		expect(toPlainText('<p>Hello</p><style>.a{color:red}</style>')).toBe('Hello');
	});
});

/**
 * The same gap the renderer had: inside a foreign namespace `tagName` keeps its authored case, so
 * `<svg><script>` arrived as `script` and walked past a check written in upper case. Nothing could
 * execute - this function only ever returns text - but the script source became the description,
 * and the card asks this function whether an entry has one.
 */
describe('foreign-namespace content', () => {
	it.each([
		['<svg><script>window.stolen = 1</script></svg>', 'window.stolen'],
		['<math><style>x{}</style></math>', 'x{}'],
		['<p>Safe</p><svg><script>window.stolen = 1</script></svg>', 'window.stolen'],
	])('does not read %s as prose', (note, leaked) => {
		expect(toPlainText(note)).not.toContain(leaked);
	});

	it('keeps the prose beside it', () => {
		expect(toPlainText('<p>Safe</p><svg><script>bad()</script></svg>')).toBe('Safe');
	});

	/**
	 * The card decides "no description" from this function and renders with the other walker, so a
	 * note the renderer refuses to draw must not read as having one here.
	 */
	it('agrees with the renderer that markup-only content is not a description', () => {
		expect(toPlainText('<svg><script>bad()</script></svg>').trim()).toBe('');
	});
});

import { describe, expect, it } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { Note } from './Note';

/**
 * Rendered, not called. Invoking it as a plain function skips React entirely and would break the
 * moment `Note` reaches for a hook; the wrapper exists only to give the assertions somewhere to
 * look for text that is deliberately returned as a bare string.
 */
function renderNote(note: string) {
	return render(
		<section aria-label="note">
			<Note note={note} />
		</section>
	);
}

describe('Note', () => {
	it('returns plain text untouched, so the common case never builds a tree', () => {
		renderNote('Standup and time logging.');

		expect(screen.getByRole('region', { name: 'note' })).toHaveTextContent('Standup and time logging.');
		expect(screen.getByRole('region', { name: 'note' }).querySelector('p')).toBeNull();
	});

	/**
	 * Both Productive and TipTap wrap list text in a paragraph; drawing that as a block would put
	 * every bullet on its own double-spaced line.
	 */
	it('renders the recorded Productive note as a list, without a paragraph box per item', () => {
		const { container } = renderNote('<ul><li><p>Probavam</p></li></ul>');

		expect(screen.getAllByRole('listitem')).toHaveLength(1);
		expect(screen.getByText('Probavam')).toBeInTheDocument();
		expect(container.querySelector('li p')).toBeNull();
	});

	it('renders emphasis as emphasis, whichever tag it arrived as', () => {
		const { container } = renderNote('<p><b>bold</b> <i>italic</i> <s>struck</s></p>');

		expect(container.querySelector('strong')).toHaveTextContent('bold');
		expect(container.querySelector('em')).toHaveTextContent('italic');
		expect(container.querySelector('s')).toHaveTextContent('struck');
	});

	/**
	 * The renderer fails closed. Attributes are never read, so there is no path for an `onerror`
	 * to reach the DOM, and a tag outside the allowlist contributes its text and loses its box.
	 */
	it.each([
		['<p>Safe</p><script>window.pwned = 1</script>', 'script'],
		['<p>Safe</p><img src="x" onerror="1">', 'img'],
	])('drops %s', (note, tag) => {
		const { container } = renderNote(note);

		expect(screen.getByText('Safe')).toBeInTheDocument();
		expect(container.querySelector(tag)).toBeNull();
	});

	/**
	 * `tagName` keeps its authored case inside a foreign namespace, so these arrive lower case and
	 * would walk past an upper-case comparison. Nothing could execute either way - the parsed
	 * nodes are never inserted, only read - but the source would land on screen as text.
	 */
	it('drops a foreign-namespace element rather than leaking its source as text', () => {
		renderNote('<p>Safe</p><svg><script>window.pwned = 1</script></svg>');

		expect(screen.getByText('Safe')).toBeInTheDocument();
		expect(screen.getByRole('region', { name: 'note' })).not.toHaveTextContent('window.pwned');
	});
});

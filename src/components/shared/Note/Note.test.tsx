import { describe, expect, it } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { Note } from './Note';

function renderNote(note: string) {
	return render(<div data-testid="note">{Note({ note })}</div>);
}

describe('Note', () => {
	it('returns plain text untouched, so the common case never builds a tree', () => {
		renderNote('Standup and time logging.');

		expect(screen.getByTestId('note')).toHaveTextContent('Standup and time logging.');
		expect(screen.getByTestId('note').querySelector('p')).toBeNull();
	});

	it('renders the recorded Productive note as a list', () => {
		const { container } = renderNote('<ul><li><p>Probavam</p></li></ul>');

		expect(container.querySelectorAll('ul li')).toHaveLength(1);
		expect(screen.getByText('Probavam')).toBeInTheDocument();
	});

	it('renders an ordered list as one', () => {
		const { container } = renderNote('<ol><li><p>one</p></li><li><p>two</p></li></ol>');

		expect(container.querySelectorAll('ol li')).toHaveLength(2);
	});

	it.each([
		['<p>a <strong>b</strong></p>', 'strong'],
		['<p>a <b>b</b></p>', 'strong'],
		['<p>a <em>b</em></p>', 'em'],
		['<p>a <i>b</i></p>', 'em'],
		['<p>a <s>b</s></p>', 's'],
	])('renders %s as %s', (note, tag) => {
		const { container } = renderNote(note);

		expect(container.querySelector(tag)).toHaveTextContent('b');
	});

	/**
	 * The renderer fails closed. Attributes are never read, so there is no path for an `onerror`
	 * to reach the DOM, and a tag outside the allowlist contributes its text and loses its box.
	 */
	it.each([
		['<p>Safe</p><script>window.pwned = 1</script>', 'script'],
		['<p>Safe</p><img src="x" onerror="1">', 'img'],
		['<p>Safe</p><iframe src="evil"></iframe>', 'iframe'],
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
	it.each([
		['<p>Safe</p><svg><script>window.pwned = 1</script></svg>', 'window.pwned'],
		['<p>Safe</p><math><mtext>hidden</mtext></math>', 'hidden'],
	])('drops the foreign-namespace element in %s', (note, leaked) => {
		renderNote(note);

		expect(screen.getByText('Safe')).toBeInTheDocument();
		expect(screen.getByTestId('note')).not.toHaveTextContent(leaked);
	});

	it('keeps the words of a tag it does not render', () => {
		renderNote('<div><h2>Heading</h2></div>');

		expect(screen.getByTestId('note')).toHaveTextContent('Heading');
	});

	it('renders a line break', () => {
		const { container } = renderNote('<p>one<br>two</p>');

		expect(container.querySelector('br')).toBeInTheDocument();
	});

	/**
	 * Both Productive and TipTap wrap list text in a paragraph; drawing that as a block would put
	 * every bullet on its own double-spaced line.
	 */
	it('does not give a list item its own paragraph box', () => {
		const { container } = renderNote('<ul><li><p>one</p></li></ul>');

		expect(container.querySelector('li p')).toBeNull();
		expect(container.querySelector('li')).toHaveTextContent('one');
	});

	it('renders nothing for an empty note', () => {
		renderNote('');

		expect(screen.getByTestId('note')).toBeEmptyDOMElement();
	});
});

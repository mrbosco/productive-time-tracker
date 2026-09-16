import { Fragment, type ReactNode } from 'react';
import { containsMarkup } from '@/lib/note';

/**
 * A time entry's description, with the structure Productive stored (A-9, ADR-0010).
 *
 * `toPlainText` answers "what does this say" and is still what a confirmation dialog or a document
 * title wants. This answers "what does this look like", which is what the card and the day view
 * want: an entry written as a list in Productive is drawn as a list here.
 *
 * `dangerouslySetInnerHTML` is used nowhere in this app and this component is the reason it does
 * not have to be. The markup is parsed by the platform into an inert document and then walked, and
 * only the tags below become elements. It fails closed: attributes are never read at all, so an
 * `onerror` cannot survive the walk, and an unknown tag contributes its text and loses its box.
 */
const INLINE_TAGS = new Map<string, 'strong' | 'em' | 's' | 'code'>([
	['STRONG', 'strong'],
	['B', 'strong'],
	['EM', 'em'],
	['I', 'em'],
	['S', 's'],
	['STRIKE', 's'],
	['DEL', 's'],
	['CODE', 'code'],
]);

/** Elements whose text is code, not prose, and must not be rendered as the note. */
const NON_PROSE_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'TITLE', 'IFRAME', 'OBJECT', 'EMBED']);

function renderChildren(node: Node): ReactNode[] {
	const out: ReactNode[] = [];

	node.childNodes.forEach((child, index) => {
		if (child.nodeType === Node.TEXT_NODE) {
			out.push(child.textContent);

			return;
		}

		if (!(child instanceof Element) || NON_PROSE_TAGS.has(child.tagName)) return;

		const key = `${child.tagName}-${String(index)}`;

		if (child.tagName === 'BR') {
			out.push(<br key={key} />);

			return;
		}

		const inline = INLINE_TAGS.get(child.tagName);
		if (inline !== undefined) {
			const Inline = inline;
			out.push(<Inline key={key}>{renderChildren(child)}</Inline>);

			return;
		}

		if (child.tagName === 'UL') {
			out.push(
				<ul key={key} className="list-outside list-disc pl-5">
					{renderChildren(child)}
				</ul>
			);

			return;
		}

		if (child.tagName === 'OL') {
			out.push(
				<ol key={key} className="list-outside list-decimal pl-5">
					{renderChildren(child)}
				</ol>
			);

			return;
		}

		if (child.tagName === 'LI') {
			out.push(<li key={key}>{renderChildren(child)}</li>);

			return;
		}

		// A paragraph inside a list item is how both Productive and TipTap wrap list text; drawing
		// it as a block there would put every bullet on its own double-spaced line.
		if (child.tagName === 'P') {
			const isInsideListItem = child.parentElement?.tagName === 'LI';
			out.push(
				isInsideListItem ? (
					<Fragment key={key}>{renderChildren(child)}</Fragment>
				) : (
					<p key={key}>{renderChildren(child)}</p>
				)
			);

			return;
		}

		// A heading, a div, a table: contributes its contents and loses its own box. Nothing a
		// reader would miss is dropped, and no unknown tag ever becomes an element.
		out.push(<Fragment key={key}>{renderChildren(child)}</Fragment>);
	});

	return out;
}

/**
 * Plain text - everything this app wrote before ADR-0010, and everything typed without reaching
 * for a list - is returned as a string, so the common case never builds a tree and the caller's
 * `whitespace-pre-line` keeps doing the work for line breaks.
 */
export function Note({ note }: { note: string }): ReactNode {
	if (note === '') return '';
	if (!containsMarkup(note)) return note;

	const { body } = new DOMParser().parseFromString(note, 'text/html');

	return <>{renderChildren(body)}</>;
}

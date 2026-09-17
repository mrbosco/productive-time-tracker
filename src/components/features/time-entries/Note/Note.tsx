import { Fragment, type ReactNode } from 'react';
import { containsMarkup, isNonProse } from '@/lib/note';

/** A time entry's description, with the structure Productive stored (ADR-0010), and why
 * `dangerouslySetInnerHTML` appears nowhere. The markup is parsed into an inert document and walked;
 * only the tags below become elements, attributes are never read, and an unknown tag loses its box. */
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

function renderChildren(node: Node): ReactNode[] {
	const out: ReactNode[] = [];

	node.childNodes.forEach((child, index) => {
		if (child.nodeType === Node.TEXT_NODE) {
			out.push(child.textContent);

			return;
		}

		if (!(child instanceof Element)) return;

		/* `tagName` is upper case for HTML elements but keeps its authored case inside a foreign
		 * namespace, so an `<svg><script>` arrives as `script` and would walk past a check against
		 * `SCRIPT`. Nothing can execute - the nodes are never inserted - but the source would show
		 * up on screen as text. */
		if (isNonProse(child)) return;

		const tag = child.tagName.toUpperCase();

		const key = `${tag}-${String(index)}`;

		if (tag === 'BR') {
			out.push(<br key={key} />);

			return;
		}

		const inline = INLINE_TAGS.get(tag);
		if (inline !== undefined) {
			const Inline = inline;
			out.push(<Inline key={key}>{renderChildren(child)}</Inline>);

			return;
		}

		if (tag === 'UL') {
			out.push(
				<ul key={key} className="list-outside list-disc pl-5">
					{renderChildren(child)}
				</ul>
			);

			return;
		}

		if (tag === 'OL') {
			out.push(
				<ol key={key} className="list-outside list-decimal pl-5">
					{renderChildren(child)}
				</ol>
			);

			return;
		}

		if (tag === 'LI') {
			out.push(<li key={key}>{renderChildren(child)}</li>);

			return;
		}

		// A paragraph inside a list item is how both Productive and TipTap wrap list text; drawing
		// it as a block there would put every bullet on its own double-spaced line.
		if (tag === 'P') {
			const isInsideListItem = child.parentElement?.tagName.toUpperCase() === 'LI';
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

/** Plain text - everything this app wrote before ADR-0010, and everything typed without reaching
 * for a list - is returned as a string, so the common case never builds a tree and the caller's
 * `whitespace-pre-line` keeps doing the work for line breaks. */
export function Note({ note }: { note: string }): ReactNode {
	if (note === '') return '';
	if (!containsMarkup(note)) return note;

	const { body } = new DOMParser().parseFromString(note, 'text/html');

	return <>{renderChildren(body)}</>;
}

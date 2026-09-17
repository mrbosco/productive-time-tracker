import { Editor } from '@tiptap/react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { EDITOR_EXTENSIONS, RichTextEditor } from './RichTextEditor';

/**
 * ProseMirror does not receive input under jsdom - it listens for `beforeinput` and composition
 * events jsdom does not implement - so typing is covered in `e2e/entry-create.spec.ts`, in a
 * browser that runs the editor for real. What is asserted here is what does not need a keystroke:
 * the schema it applies to content.
 */
function renderEditor(value: string, onChange = vi.fn()) {
	return render(
		<>
			<span id="note-label">Description</span>
			<RichTextEditor value={value} onChange={onChange} aria-labelledby="note-label" placeholder="What?" />
		</>
	);
}

describe('RichTextEditor', () => {
	/**
	 * The deciding fact behind the rich-text decision, asserted rather than asserted-about. TipTap
	 * was chosen because its schema writes the shape Productive already stores, so an upgrade that
	 * changed the shape has to fail here rather than quietly start writing a second dialect.
	 */
	it('round-trips the recorded Productive note byte for byte', () => {
		const recorded = '<ul><li><p>Probavam</p></li></ul>';
		const editor = new Editor({ extensions: EDITOR_EXTENSIONS, content: recorded });

		try {
			expect(editor.getHTML()).toBe(recorded);
		} finally {
			editor.destroy();
		}
	});

	it('discards what its schema does not define, which is what makes it the sanitiser', () => {
		const editor = new Editor({
			extensions: EDITOR_EXTENSIONS,
			content: '<p>hi</p><script>alert(1)</script><img src=x onerror=alert(1)>',
		});

		try {
			expect(editor.getHTML()).toBe('<p>hi</p>');
		} finally {
			editor.destroy();
		}
	});

	it('renders a note stored as a list as a list', () => {
		renderEditor('<ul><li><p>Probavam</p></li></ul>');

		expect(screen.getAllByRole('listitem')).toHaveLength(1);
	});

	/** A note is not a document: headings would be a shape Productive's own field does not offer. */
	it('flattens a heading into prose', () => {
		renderEditor('<h1>Big</h1>');

		expect(screen.queryByRole('heading')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Big');
	});
});

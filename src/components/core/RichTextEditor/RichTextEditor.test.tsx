import { Editor } from '@tiptap/react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { EDITOR_EXTENSIONS, RichTextEditor } from './RichTextEditor';

/**
 * ProseMirror does not receive input under jsdom - it listens for `beforeinput` and composition
 * events jsdom does not implement - so typing is covered in `e2e/entry-create.spec.ts`, in a
 * browser that runs the editor for real. What is asserted here is everything that does not need a
 * keystroke: the schema it applies to content, and the wiring that makes it a labelled field.
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
	it('is a named, multiline field rather than a mystery box (guidebook 18)', () => {
		renderEditor('');

		const field = screen.getByRole('textbox', { name: 'Description' });

		expect(field).toHaveAttribute('contenteditable', 'true');
		expect(field).toHaveAttribute('aria-multiline', 'true');
	});

	it('shows the placeholder only while there is nothing written', () => {
		renderEditor('');

		expect(screen.getByText('What?')).toBeInTheDocument();
	});

	it('hides the placeholder once the note has content', () => {
		renderEditor('<p>Something</p>');

		expect(screen.queryByText('What?')).not.toBeInTheDocument();
	});

	/**
	 * ADR-0010's deciding fact, asserted rather than asserted-about. TipTap was chosen because its
	 * schema writes the shape Productive already stores, so an upgrade that changed the shape has
	 * to fail here rather than quietly start writing a second dialect.
	 */
	it('round-trips the recorded Productive note byte for byte (ADR-0010)', () => {
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

	/**
	 * The decisive property of ADR-0010: the editor's schema is the sanitiser. Content is parsed
	 * into the nodes it defines and everything else is discarded, which is why the app renders
	 * Productive's HTML without ever reaching for `dangerouslySetInnerHTML`.
	 */
	it('discards anything outside its schema rather than keeping it', () => {
		const { container } = renderEditor('<p>Safe</p><script>window.pwned = 1</script><img src="x" onerror="1">');

		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Safe');
		expect(container.querySelector('script')).toBeNull();
		expect(container.querySelector('img')).toBeNull();
	});

	/** A note is not a document: headings would be a shape Productive's own field does not offer. */
	it('flattens a heading into prose', () => {
		renderEditor('<h1>Big</h1>');

		expect(screen.queryByRole('heading')).not.toBeInTheDocument();
		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveTextContent('Big');
	});

	it('marks itself invalid when the field is', () => {
		render(
			<>
				<span id="note-label">Description</span>
				<RichTextEditor value="" onChange={vi.fn()} aria-labelledby="note-label" aria-invalid />
			</>
		);

		expect(screen.getByRole('textbox', { name: 'Description' })).toHaveAttribute('aria-invalid', 'true');
	});
});

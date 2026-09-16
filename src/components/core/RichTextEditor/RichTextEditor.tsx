import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

/**
 * The note editor (ADR-0010).
 *
 * Trimmed to what a time-entry description is: paragraphs, bold, italic, strike and the two list
 * kinds. A note is not a document, so headings, blockquotes, code blocks, horizontal rules and
 * links are off - each would be a shape Productive's own field does not offer here, and a shape
 * this app would then have to render.
 *
 * What makes TipTap the right buy rather than a convenience is that its schema *is* the
 * sanitiser: content is parsed into the nodes below and everything else is discarded, so pasting
 * a page of markup yields prose and nothing executable ever enters the document.
 */
export const EDITOR_EXTENSIONS = [
	StarterKit.configure({
		heading: false,
		blockquote: false,
		code: false,
		codeBlock: false,
		horizontalRule: false,
		link: false,
		underline: false,
	}),
];

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tab means "the next control", not "indent this list".
 *
 * The editor is a field inside a form, and a list's own Tab binding would otherwise trap a
 * keyboard user between the bullets and Save (guidebook 18). ProseMirror consults `handleKeyDown`
 * before any keymap, but only stops if the handler claims the event - so claiming it means taking
 * responsibility for moving focus, which is what this does. Lists are still made with `- ` and
 * Enter, which is how they are made in the first place.
 */
function moveFocusOut(from: HTMLElement, backwards: boolean): void {
	const focusable = [...document.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
		(element) => element.offsetParent !== null || element === from
	);
	const next = focusable.filter((element) => {
		const where = from.compareDocumentPosition(element);

		return backwards
			? (where & Node.DOCUMENT_POSITION_PRECEDING) !== 0
			: (where & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
	});

	(backwards ? next.at(-1) : next.at(0))?.focus();
}

interface RichTextEditorProps {
	/** HTML, as the API stores it. */
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	id?: string;
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	className?: string;
}

/**
 * `value` seeds the editor and is not pushed back in on every keystroke: ProseMirror owns the
 * document once it is mounted, and rewriting it from a prop would fight the caret. It is
 * re-applied only when the caller swaps in a genuinely different note - opening a different entry
 * to edit - which `setContent` handles without losing the selection for the common no-op.
 */
export function RichTextEditor({
	value,
	onChange,
	placeholder,
	id,
	className,
	'aria-labelledby': ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
}: RichTextEditorProps) {
	const editor = useEditor({
		extensions: EDITOR_EXTENSIONS,
		content: value,
		editorProps: {
			handleKeyDown: (view, event) => {
				if (event.key !== 'Tab') return false;

				moveFocusOut(view.dom, event.shiftKey);

				return true;
			},
			attributes: {
				// Stated, not inferred. `contenteditable` alone is not a role - assistive
				// technology and the testing tools that model it both need to be told this is a
				// multiline field, and the label wiring is what gives it a name (guidebook 18).
				role: 'textbox',
				'aria-multiline': 'true',
				...(id === undefined ? {} : { id }),
				...(ariaLabelledBy === undefined ? {} : { 'aria-labelledby': ariaLabelledBy }),
				...(ariaDescribedBy === undefined ? {} : { 'aria-describedby': ariaDescribedBy }),
				...(ariaInvalid === true ? { 'aria-invalid': 'true' } : {}),
				class: 'outline-hidden',
			},
		},
		onUpdate: ({ editor: current }) => {
			// `isEmpty` rather than comparing to `<p></p>`: an empty document still serialises to
			// a paragraph, and a caller that stored that would write markup for a note the user
			// left blank.
			onChange(current.isEmpty ? '' : current.getHTML());
		},
	});

	useEffect(() => {
		if (editor === null || editor.isDestroyed) return;
		if (value === (editor.isEmpty ? '' : editor.getHTML())) return;

		editor.commands.setContent(value, { emitUpdate: false });
	}, [editor, value]);

	return (
		<div
			className={cn(
				'relative min-h-28 w-full rounded-input border border-line bg-surface px-4 py-3.5',
				'text-base leading-[1.45] text-ink transition-[color,background-color,border-color]',
				'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent',
				'aria-invalid:border-danger',
				// The document's own typography. Tailwind's Preflight strips list markers, so the
				// two list kinds have to ask for them back, and paragraphs are spaced rather than
				// margined so an empty note is exactly one line tall.
				'[&_li]:m-0 [&_ol]:m-0 [&_p]:m-0 [&_ul]:m-0',
				'[&_ul]:list-outside [&_ul]:list-disc [&_ul]:pl-5',
				'[&_ol]:list-outside [&_ol]:list-decimal [&_ol]:pl-5',
				'[&_.ProseMirror]:flex [&_.ProseMirror]:flex-col [&_.ProseMirror]:gap-1',
				className
			)}
			aria-invalid={ariaInvalid}
		>
			{/*
			 * The placeholder is drawn rather than pulled in as another extension: it is one
			 * absolutely positioned line that shows while the document is empty, and `aria-hidden`
			 * because the field already has a label.
			 */}
			{placeholder !== undefined && editor?.isEmpty === true && (
				<span aria-hidden="true" className="pointer-events-none absolute text-muted">
					{placeholder}
				</span>
			)}
			<EditorContent editor={editor} />
		</div>
	);
}

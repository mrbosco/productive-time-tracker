import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { useHotkeys, type Hotkeys } from './useHotkeys';

/**
 * Exercised through a component rather than `renderHook`, because what the hook does is listen to
 * the document: the guard is about what has focus, and there is no focus without a DOM to put it
 * in (testing.md rule 4).
 */
function Harness({ hotkeys, enabled }: { hotkeys: Hotkeys; enabled?: boolean }) {
	useHotkeys(hotkeys, { enabled });

	return (
		<div>
			<label htmlFor="field">Field</label>
			<input id="field" />
			<button type="button">Somewhere else</button>
		</div>
	);
}

describe('useHotkeys', () => {
	it('runs the handler for the key it is given', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ n: onNew }} />);

		await user.keyboard('n');

		expect(onNew).toHaveBeenCalledTimes(1);
	});

	it('ignores a key nothing is bound to', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ n: onNew }} />);

		await user.keyboard('q');

		expect(onNew).not.toHaveBeenCalled();
	});

	/** SPEC 10, X-2: "all shortcuts are disabled while an input, textarea or dialog has focus". */
	it('stays out of the way while a field has focus (X-2)', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ n: onNew }} />);

		await user.click(screen.getByLabelText('Field'));
		await user.keyboard('n');

		expect(onNew).not.toHaveBeenCalled();
		expect(screen.getByLabelText('Field')).toHaveValue('n');
	});

	/** `Cmd+N` opens a window and `Ctrl+E` moves the caret; a tracker takes neither. */
	it('leaves modified keystrokes to the browser', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ n: onNew }} />);

		await user.keyboard('{Meta>}n{/Meta}');
		await user.keyboard('{Control>}n{/Control}');

		expect(onNew).not.toHaveBeenCalled();
	});

	/** Shift is the exception the rule above needs, because `?` cannot be typed without it. */
	it('takes a shifted key, which is the only way to type ?', async () => {
		const onHelp = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ '?': onHelp }} />);

		await user.keyboard('?');

		expect(onHelp).toHaveBeenCalledTimes(1);
	});

	it('binds nothing while disabled', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		await renderWithProviders(<Harness hotkeys={{ n: onNew }} enabled={false} />);

		await user.keyboard('n');

		expect(onNew).not.toHaveBeenCalled();
	});

	/** A listener left on `window` outlives the screen that wanted it. */
	it('stops listening once it is unmounted', async () => {
		const onNew = vi.fn();
		const user = userEvent.setup();
		const { unmount } = await renderWithProviders(<Harness hotkeys={{ n: onNew }} />);

		unmount();
		await user.keyboard('n');

		expect(onNew).not.toHaveBeenCalled();
	});
});

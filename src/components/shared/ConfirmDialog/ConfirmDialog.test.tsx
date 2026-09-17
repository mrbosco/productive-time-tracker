import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { ConfirmDialog } from './ConfirmDialog';

function renderDialog(props: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
	return renderWithProviders(
		<ConfirmDialog
			open
			onOpenChange={vi.fn()}
			title="Delete this entry?"
			confirmLabel="Delete"
			onConfirm={vi.fn()}
			cancelLabel="Cancel"
			{...props}
		>
			1h 30m · Standup and time logging.
		</ConfirmDialog>
	);
}

describe('ConfirmDialog', () => {
	it('takes the answer', async () => {
		const onConfirm = vi.fn();
		const user = userEvent.setup();
		await renderDialog({ onConfirm });

		await user.click(screen.getByRole('button', { name: 'Delete' }));

		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	/** `UnsavedChangesDialog` needs this: declining there discards a draft rather than just closing. */
	it('runs onCancel instead of closing when one is given', async () => {
		const onCancel = vi.fn();
		const onOpenChange = vi.fn();
		const user = userEvent.setup();
		await renderDialog({ onCancel, onOpenChange });

		await user.click(screen.getByRole('button', { name: 'Cancel' }));

		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onOpenChange).not.toHaveBeenCalled();
	});

	/**
	 * The reason this component exists. Radix focuses the first tabbable, so Enter pressed on a
	 * dialog nobody meant to summon would take the affirmative - which for a delete is an entry
	 * gone.
	 */
	it('puts focus on the safe choice, not the destructive one', async () => {
		await renderDialog({ confirmVariant: 'destructive' });

		expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
	});
});

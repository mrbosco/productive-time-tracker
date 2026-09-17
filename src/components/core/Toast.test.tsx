import { describe, expect, it } from 'vitest';
import { render, screen } from '@/__tests__/test-utils';
import { Toast } from './Toast';

describe('Toast', () => {
	/**
	 * A failure is not a confirmation: it reports that what the user asked for did not happen, and
	 * `role="status"` would let a screen reader finish its sentence first.
	 */
	it.each([
		{ variant: 'success', message: 'Entry saved', role: 'status', notRole: 'alert' },
		{ variant: 'error', message: 'Could not delete the entry.', role: 'alert', notRole: 'status' },
	] as const)('announces a $variant as $role', ({ variant, message, role, notRole }) => {
		render(
			<Toast variant={variant} onDismiss={() => undefined}>
				{message}
			</Toast>
		);

		expect(screen.getByRole(role)).toHaveTextContent(message);
		expect(screen.queryByRole(notRole)).not.toBeInTheDocument();
	});
});

import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '@/__tests__/test-utils';
import { Button } from './Button';

describe('Button', () => {
	it('renders as a button with its accessible name', async () => {
		await renderWithProviders(<Button>Add entry</Button>);

		expect(screen.getByRole('button', { name: /add entry/i })).toBeInTheDocument();
	});

	it('calls onClick when clicked', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		await renderWithProviders(<Button onClick={onClick}>Add entry</Button>);

		await user.click(screen.getByRole('button', { name: /add entry/i }));

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	it('does not fire when disabled', async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		await renderWithProviders(
			<Button disabled onClick={onClick}>
				Add entry
			</Button>
		);

		await user.click(screen.getByRole('button', { name: /add entry/i }));

		expect(onClick).not.toHaveBeenCalled();
	});
});

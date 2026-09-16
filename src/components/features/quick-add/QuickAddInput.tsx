import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Input } from '@/components/core/Input';

/**
 * The quick-add line (SPEC 10, P-1). Submitting opens the entry form for the day being shown.
 *
 * The parser that turns `1.5h client call yesterday` into `{ time, note, date }` is P-1's, so for
 * now the text is not read - the form opens empty rather than prefilled. Drawn here because the
 * design puts it on this screen, and it never submits to the API directly either way.
 */
export function QuickAddInput({ date }: { date: string }) {
	const navigate = useNavigate();
	const [value, setValue] = useState('');

	return (
		<form
			className="flex flex-col gap-1.5"
			onSubmit={(event) => {
				event.preventDefault();
				void navigate({ to: '/entries/new', search: { date } });
			}}
		>
			{/* The placeholder is the whole instruction, so the label is there for a screen reader only. */}
			<label htmlFor="quick-add" className="sr-only">
				Quick add an entry
			</label>
			<Input
				id="quick-add"
				value={value}
				onChange={(event) => {
					setValue(event.target.value);
				}}
				placeholder="Quick add: 1.5h client call yesterday"
				className="h-12 text-list"
			/>
			<span className="pl-0.5 text-caption text-muted">Opens the form prefilled</span>
		</form>
	);
}

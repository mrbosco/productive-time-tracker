import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('keeps a custom type size alongside a colour', () => {
		// Both are `text-*`, but one is a size and one is a colour: dropping either is a bug.
		expect(cn('text-label', 'text-muted')).toBe('text-label text-muted');
	});

	it('still lets a later size replace an earlier one', () => {
		expect(cn('text-meta', 'text-title')).toBe('text-title');
	});

	it('still lets a later colour replace an earlier one', () => {
		expect(cn('text-muted', 'text-ink')).toBe('text-ink');
	});

	it('merges Tailwind’s own scales as before', () => {
		expect(cn('px-4', 'px-6')).toBe('px-6');
	});
});

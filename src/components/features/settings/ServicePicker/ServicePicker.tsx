import { useId, useRef, useState } from 'react';
import type { Service } from '@/api/types';
import { Avatar } from '@/components/core/Avatar';
import { Input } from '@/components/core/Input';
import { cn } from '@/lib/utils';
import { describeCount, type PickerRow, toPickerList } from './ServicePicker.utils';

function SearchIcon() {
	return (
		<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M8.6 2.4a6.2 6.2 0 0 1 4.8 10.1l4 4-1.4 1.4-4-4A6.2 6.2 0 1 1 8.6 2.4Zm0 2a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4Z"
				fill="currentColor"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true">
			<path d="M5.4 10.2 7 8.6l2.2 2.2 5-5 1.6 1.6-6.6 6.6-3.8-3.8Z" fill="currentColor" />
		</svg>
	);
}

function ClearIcon() {
	return (
		<svg width="13" height="13" viewBox="0 0 20 20" aria-hidden="true">
			<path
				d="M5.6 4.2 10 8.6l4.4-4.4 1.4 1.4L11.4 10l4.4 4.4-1.4 1.4L10 11.4l-4.4 4.4-1.4-1.4L8.6 10 4.2 5.6 5.6 4.2Z"
				fill="currentColor"
			/>
		</svg>
	);
}

/** Choosing the default service from a searchable list, grouped by company. It replaces a native
 * `select`, which cannot be searched and truncates its options to the control's width. */
export function ServicePicker({
	services,
	selectedId,
	recentIds,
	ownCompanyId,
	onSelect,
}: {
	services: Service[];
	selectedId: string | null;
	recentIds: Set<string>;
	ownCompanyId: string | null;
	onSelect: (service: Service) => void;
}) {
	const searchId = useId();
	const listId = useId();
	const searchRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState('');
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const list = toPickerList(services, { query, selectedId, recentIds, ownCompanyId });
	const companies = new Set(services.map((service) => service.companyId)).size;
	const isSearching = query.trim() !== '';

	function clear() {
		setQuery('');
		setActiveIndex(null);
		searchRef.current?.focus();
	}

	function move(step: number) {
		if (list.rows.length === 0) return;
		setActiveIndex((current) => {
			const next = current === null ? 0 : current + step;

			return Math.min(Math.max(next, 0), list.rows.length - 1);
		});
	}

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="flex flex-none flex-col gap-2.5">
				<div className="relative flex items-center">
					<span aria-hidden="true" className="absolute left-3.5 text-muted">
						<SearchIcon />
					</span>
					<Input
						autoFocus
						ref={searchRef}
						id={searchId}
						// Not `type="search"`: Chrome draws its own clear button inside one, so the
						// field had two crosses in it - the browser's and the design's.
						type="text"
						role="combobox"
						aria-expanded
						aria-controls={listId}
						aria-label="Search services"
						placeholder="Search services"
						value={query}
						onChange={(event) => {
							setQuery(event.target.value);
							setActiveIndex(null);
						}}
						onKeyDown={(event) => {
							if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
								event.preventDefault();
								move(event.key === 'ArrowDown' ? 1 : -1);
							}
							if (event.key === 'Enter' && activeIndex !== null) {
								event.preventDefault();
								const row = list.rows[activeIndex];
								if (row !== undefined) onSelect(row.service);
							}
							if (event.key === 'Escape' && isSearching) {
								event.preventDefault();
								event.stopPropagation();
								clear();
							}
						}}
						className="h-12 pr-11 pl-10 text-list"
					/>
					{isSearching && (
						<button
							type="button"
							aria-label="Clear search"
							onClick={clear}
							className="duration-ui absolute right-1.5 grid size-9 place-items-center rounded-pill text-muted transition-colors ease-ui hover:bg-subtle hover:text-ink"
						>
							<ClearIcon />
						</button>
					)}
				</div>

				<div className="flex items-baseline justify-between gap-3 px-0.5">
					<span className="text-caption text-muted">{describeCount(list, query, companies)}</span>
					{isSearching && (
						<button type="button" onClick={clear} className="text-caption font-medium text-accent hover:underline">
							Show all
						</button>
					)}
				</div>
			</div>

			<div id={listId} className="-mx-3 mt-2 min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
				{list.rows.length === 0 ? (
					<div className="flex flex-col items-center gap-3.5 px-5 py-10 text-center">
						<p className="text-list">No service matches “{query.trim()}”.</p>
						<button
							type="button"
							onClick={clear}
							className="duration-ui h-11 rounded-pill border border-line px-4.5 text-meta font-medium transition-colors ease-ui hover:bg-subtle"
						>
							Clear search
						</button>
					</div>
				) : (
					list.groups.map((group) => (
						<div key={group.companyId || 'all'} className="flex flex-col gap-0.5 pt-2.5">
							{!isSearching && (
								<div className="sticky top-0 z-1 flex items-center gap-2.5 bg-surface px-3 pt-1.5 pb-2">
									<Avatar
										name={group.company}
										src={group.avatarUrl}
										initialsFrom="start"
										className="size-6 flex-none rounded-[7px] object-contain p-0.5"
										fallbackClassName="bg-selection text-[9px] font-bold text-accent-dark"
									/>
									<span className="truncate text-caption font-bold tracking-[.02em] text-muted">{group.company}</span>
									<span aria-hidden="true" className="h-px flex-1 bg-line" />
								</div>
							)}

							{group.rows.map((row) => (
								<Row
									key={row.service.id}
									row={row}
									isSelected={row.service.id === selectedId}
									isActive={list.rows[activeIndex ?? -1]?.service.id === row.service.id}
									onSelect={() => {
										onSelect(row.service);
									}}
								/>
							))}
						</div>
					))
				)}
			</div>
		</div>
	);
}

function Row({
	row,
	isSelected,
	isActive,
	onSelect,
}: {
	row: PickerRow;
	isSelected: boolean;
	isActive: boolean;
	onSelect: () => void;
}) {
	return (
		<button
			type="button"
			aria-pressed={isSelected}
			onClick={onSelect}
			className={cn(
				'duration-ui flex min-h-14 w-full items-center gap-3 rounded-input px-3 py-2.5 text-left transition-colors ease-ui md:min-h-[56px]',
				isSelected ? 'bg-selection' : 'hover:bg-subtle',
				isActive && 'outline-2 -outline-offset-2 outline-accent'
			)}
		>
			<span
				aria-hidden="true"
				className={cn(
					'grid size-5 flex-none place-items-center rounded-pill',
					isSelected ? 'bg-accent text-on-accent' : 'border-[1.5px] border-line'
				)}
			>
				{isSelected && <CheckIcon />}
			</span>

			<span className="flex min-w-0 flex-1 flex-col gap-0.5">
				<span className={cn('truncate text-base md:text-list', isSelected && 'font-medium text-accent-dark')}>
					{row.service.name}
				</span>
				<span className={cn('truncate text-caption', isSelected ? 'text-accent-dark/70' : 'text-muted')}>
					{row.subtitle}
				</span>
			</span>

			{isSelected ? (
				<span className="flex-none text-micro font-bold tracking-[.04em] text-accent-dark uppercase">Default</span>
			) : (
				row.isRecent && <span className="flex-none text-micro font-medium text-muted">Recent</span>
			)}
		</button>
	);
}

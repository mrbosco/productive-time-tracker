import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/core/Button';

export const Route = createFileRoute('/')({
	component: ScaffoldPage,
});

/** Placeholder. The first feature route replaces this with the `/day/$date` redirect. */
function ScaffoldPage() {
	return (
		<main className="mx-4 flex min-h-dvh flex-col items-start justify-center gap-4 md:mx-12">
			<h1 className="text-title font-bold tracking-tight md:text-display">Tracktive</h1>
			<p className="max-w-prose text-list text-muted">
				Scaffold only. Routes, API client and features land in the pull requests that follow.
			</p>
			<Button>Add entry</Button>
		</main>
	);
}

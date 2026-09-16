import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import { SessionProvider } from '@/components/features/auth/useSession';
import { createQueryClient } from '@/lib/query-client';
import { createAppRouter } from '@/router';
import '@/styles/index.css';

async function startMocks() {
	if (import.meta.env.VITE_ENABLE_MSW !== 'true') return;

	const { worker } = await import('@/mocks/browser');
	await worker.start({ onUnhandledRequest: 'bypass' });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element');

const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

void startMocks().then(() => {
	createRoot(rootElement).render(
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<SessionProvider>
					<App router={router} />
				</SessionProvider>
			</QueryClientProvider>
		</StrictMode>
	);
});

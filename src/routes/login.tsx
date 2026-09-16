import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/components/features/auth/LoginForm/LoginForm';

export const Route = createFileRoute('/login')({
	beforeLoad: ({ context }) => {
		// Nobody with a session should see this screen, including on a typed URL or a back button.
		if (context.auth.session !== null) throw redirect({ to: '/' });
	},
	component: LoginRoute,
});

function LoginRoute() {
	return (
		<main className="flex min-h-dvh flex-col items-center justify-center px-5 py-8">
			<LoginForm />
		</main>
	);
}

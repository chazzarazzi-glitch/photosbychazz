import { Navigation } from '@/components/navigation';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <main className="flex items-center justify-center px-4 py-12">
        <LoginForm />
      </main>
    </div>
  );
}

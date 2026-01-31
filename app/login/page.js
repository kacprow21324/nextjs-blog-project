import { redirect } from 'next/navigation';
import { getSession } from '@/app/actions';
import LoginForm from '@/app/components/Login';
import Link from 'next/link';
import ThemeToggle from '@/app/components/ThemeToggle';

export const metadata = {
  title: 'Logowanie - Wypasiony Blog',
  description: 'Zaloguj się do Wypasionego Bloga',
};

export default async function LoginPage() {
  // Sprawdź czy użytkownik jest już zalogowany
  const session = await getSession();
  
  if (session) {
    redirect('/');
  }

  return (
    <div className="auth-container">
      <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
        <ThemeToggle />
      </div>
      <h1 className="blog-title">Wypasiony Blog</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Zaloguj się, aby kontynuować
      </p>
      
      <div className="auth-panels" style={{ justifyContent: 'center' }}>
        <LoginForm />
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
        Nie masz konta?{' '}
        <Link href="/register" style={{ color: 'var(--primary)' }}>
          Zarejestruj się
        </Link>
      </p>
    </div>
  );
}
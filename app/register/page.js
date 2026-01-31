import { redirect } from 'next/navigation';
import { getSession } from '@/app/actions';
import RegisterForm from '@/app/components/RegisterPanel';
import Link from 'next/link';
import ThemeToggle from '@/app/components/ThemeToggle';

export const metadata = {
  title: 'Rejestracja - Wypasiony Blog',
  description: 'Załóż konto w Wypasionym Blogu',
};

export default async function RegisterPage() {
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
        Utwórz nowe konto
      </p>
      
      <div className="auth-panels" style={{ justifyContent: 'center' }}>
        <RegisterForm />
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
        Masz już konto?{' '}
        <Link href="/login" style={{ color: 'var(--primary)' }}>
          Zaloguj się
        </Link>
      </p>
    </div>
  );
}
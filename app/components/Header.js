'use client';

import { logout } from '@/app/actions';
import ThemeToggle from './ThemeToggle';

export default function Header({ user }) {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header>
      <h1>Witaj, {user?.username || 'Użytkowniku'}</h1>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <ThemeToggle />
        <form action={handleLogout}>
          <button type="submit" className="btn logout">
            Wyloguj
          </button>
        </form>
      </div>
    </header>
  );
}

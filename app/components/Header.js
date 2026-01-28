'use client';

import { logout } from '@/app/actions';

export default function Header({ user }) {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header>
      <h1>Witaj, {user?.username || 'Użytkowniku'}</h1>
      <form action={handleLogout}>
        <button type="submit" className="btn logout">
          Wyloguj
        </button>
      </form>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { logout } from '@/app/actions';
import ThemeToggle from './ThemeToggle';

export default function Header({ user }) {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="site-header">
      <div className="header-left">
        <Link href="/" className="site-logo">
          Wypasiony Blog
        </Link>
        {user && (
          <span className="user-greeting">
            Witaj, <strong>{user.username}</strong>
          </span>
        )}
      </div>
      
      <nav className="header-nav">
        <Link href="/posts" className="nav-link">
          Wszystkie posty
        </Link>
        {user && (
          <Link href={`/${user.username}`} className="nav-link">
            Mój profil
          </Link>
        )}
      </nav>

      <div className="header-right">
        {user ? (
          <div className="user-menu">
            <ThemeToggle />
            <form action={handleLogout}>
              <button type="submit" className="btn logout">
                Wyloguj
              </button>
            </form>
          </div>
        ) : (
          <>
            <ThemeToggle />
            <Link href="/login" className="btn">
              Zaloguj się
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

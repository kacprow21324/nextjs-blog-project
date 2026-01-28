'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await login(formData);
      
      if (result?.success === false) {
        setError(result.error || 'Błąd logowania');
      }
      // Sukces - redirect obsługiwany przez server action
    } catch (err) {
      // Redirect from server action throws, ignore it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-panel">
      <h2>Logowanie</h2>
      <form action={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Nazwa użytkownika"
          required
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Hasło"
          required
          disabled={loading}
        />
        {error && <p className="error-message">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Logowanie...' : 'Zaloguj'}
        </button>
      </form>
    </div>
  );
}
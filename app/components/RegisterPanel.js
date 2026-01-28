'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { register } from '@/app/actions';

export default function RegisterForm() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await register(formData);
      
      if (result.success) {
        setSuccess(result.message);
        // Przekieruj po 2 sekundach
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(result.error || 'Błąd rejestracji');
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-panel">
      <h2>Rejestracja</h2>
      <form action={handleSubmit}>
        <input
          type="text"
          name="username"
          placeholder="Nazwa użytkownika (min. 3 znaki)"
          required
          minLength={3}
          disabled={loading}
        />
        <input
          type="password"
          name="password"
          placeholder="Hasło (min. 6 znaków)"
          required
          minLength={6}
          disabled={loading}
        />
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Rejestrowanie...' : 'Zarejestruj'}
        </button>
      </form>
    </div>
  );
}
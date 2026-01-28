'use client';

import React, { useState, useRef } from 'react';
import { createPost } from '@/app/actions';

export default function NewPostForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    
    try {
      const result = await createPost(formData);
      
      if (result?.success === false) {
        setError(result.error || 'Błąd podczas dodawania posta');
      } else {
        // Wyczyść formularz
        formRef.current?.reset();
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="post new-post">
      <h2>Tworzenie nowego postu</h2>
      <p>Tu wpisz tytuł, a poniżej treść posta</p>
      <form ref={formRef} action={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Tytuł"
          required
          disabled={loading}
        />
        <textarea
          name="content"
          placeholder="Treść"
          required
          disabled={loading}
        />
        {error && <p className="error-message">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Dodawanie...' : 'Dodaj post'}
        </button>
      </form>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Wszystkie pola są wymagane.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Hasła nie pasują do siebie.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Rejestracja nie powiodła się.');
      } else {
        setSuccess('Rejestracja zakończona sukcesem! Oczekiwanie na zatwierdzenie przez administratora.');
        // Optionally redirect to login after a delay
        setTimeout(() => router.push('/'), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Wystąpił nieoczekiwany błąd.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-background">
      <form onSubmit={handleSubmit} className="form-container">
        <h2 className="form-title">Rejestracja</h2>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">{success}</p>}
        <div className="form-group">
          <label htmlFor="name" className="form-label">Imię</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password" className="form-label">Hasło</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">Potwierdź hasło</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full"
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
        <div className="mt-4 text-center">
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Masz już konto?{' '}
            <Link className="form-link" href="/">
              Zaloguj się
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

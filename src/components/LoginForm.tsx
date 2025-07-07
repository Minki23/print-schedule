'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('LoginForm handleSubmit triggered! Attempting NextAuth sign-in.');
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Wymagany adres e-mail i hasło.');
      return;
    }

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(`Błędne dane logowania`);
      } else if (result?.ok) {
        router.push('/schedule');
      } else {
        setError('Logowanie nie powiodło się. Sprawdź swoje dane logowania.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Wystąpił nieoczekiwany błąd.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2 className="form-title">Logowanie</h2>
      {error && <p className="form-error">{error}</p>}
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email
        </label>
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
        <label htmlFor="password" className="form-label">
          Hasło
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary w-full"
      >
        Zaloguj się
      </button>
      <div className="mt-4 text-center">
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Nie masz konta?{' '}
          <Link className="form-link" href="/register">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </form>
  );
}

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
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-sm">
      <h2 className="text-2xl text-black font-bold mb-6 text-center">Logowanie</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Hasło
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 text-gray-700 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Login
      </button>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-700">
          Nie masz konta?{' '}
          <Link className="text-indigo-600 hover:text-indigo-800 font-medium" href="/register">
            Zarejestruj się
          </Link>
        </p>
      </div>
    </form>
  );
}

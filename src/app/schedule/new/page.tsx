'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewPrintPage() {
  const [name, setName] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printers, setPrinters] = useState<{ _id: string; name: string }[]>([]);
  const [printer, setPrinter] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name || !googleDriveLink || !duration) {
      setError('Wszystkie pola są wymagane.');
      setIsSubmitting(false);
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      setError('Wprowadź poprawny czas trwania w minutach.');
      setIsSubmitting(false);
      return;
    }

    if (!printer) {
      setError('Wybierz drukarkę.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/prints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, googleDriveLink, duration: durationNum, printer }),
      });

      if (res.ok) {
        router.push('/schedule');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to add print.');
      }
    } catch (err) {
      setError('Wystąpił nieoczekiwany błąd.');
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    async function loadPrinters() {
      try {
        const res = await fetch('/api/printers');
        if (!res.ok) throw new Error('Failed to fetch printers');
        const data = await res.json();
        setPrinters(data.printers || []);
      } catch (err) {
        console.error('Error loading printers:', err);
      }
    }
    loadPrinters();
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-lg font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-8 text-center text-black">Dodaj nowe zadanie druku</h1>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nazwa pliku
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="googleDriveLink" className="block text-sm font-medium text-gray-700 mb-1">
            Link do Google Drive
          </label>
          <input
            type="url"
            id="googleDriveLink"
            value={googleDriveLink}
            onChange={(e) => setGoogleDriveLink(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="printer" className="block text-sm font-medium text-gray-700 mb-1">
            Drukarka
          </label>
          <select
            id="printer"
            value={printer}
            onChange={e => setPrinter(e.target.value)}
            className="w-full px-3 py-2 border text-gray-700 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          >
            <option value="">Wybierz drukarkę</option>
            {printers.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
            Czas trwania (minuty)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
            min="1"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Wysyłanie...' : 'Dodaj zadanie druku'}
        </button>
      </form>
    </div>
  );
}

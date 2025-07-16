'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function NewPrintPage() {
  const [name, setName] = useState('');
  const [project, setProject] = useState('');
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

    if (!name || !project || !googleDriveLink || !duration) {
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

    const title = `${project}: ${name}`;

    try {
      const res = await fetch('/api/prints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "name": title, googleDriveLink, duration: durationNum, printer }),
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
    <div className="new-print-background">
      <div className="new-print-content">
        <div className="header-actions" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <Link href="/schedule" className="btn btn-secondary">
            ← Powrót do harmonogramu
          </Link>
        </div>
        <h1 className="new-print-title">Dodaj nowe zadanie druku</h1>
        <form onSubmit={handleSubmit} className="form-container">
          {error && <p className="form-error">{error}</p>}
          <div className="form-group">
            <label htmlFor="project" className="form-label">
              Projekt:
            </label>
            <input
              type="text"
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="form-input"
              required
            />
            <label htmlFor="name" className="form-label mt-3">
              Nazwa pliku
            </label>
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
            <label htmlFor="googleDriveLink" className="form-label">
              Link do Google Drive
            </label>
            <input
              type="url"
              id="googleDriveLink"
              value={googleDriveLink}
              onChange={(e) => setGoogleDriveLink(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="printer" className="form-label">
              Drukarka
            </label>
            <select
              id="printer"
              value={printer}
              onChange={e => setPrinter(e.target.value)}
              className="form-select"
              required
            >
              <option value="">Wybierz drukarkę</option>
              {printers.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="duration" className="form-label">
              Czas trwania (minuty)
            </label>
            <input
              type="number"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="form-input"
              required
              min="1"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? 'Wysyłanie...' : 'Dodaj zadanie druku'}
          </button>
        </form>
      </div>
    </div>
  );
}

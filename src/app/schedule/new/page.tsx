'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Notification from '@/components/Notification';

interface Filament {
  _id: string;
  color: string;
  brand: string;
  material: string;
  diameter: number;
  weight: number;
}

export default function NewPrintPage() {
  const [name, setName] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');
  const [duration, setDuration] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [printers, setPrinters] = useState<{ _id: string; name: string; location?: string }[]>([]);
  const [printer, setPrinter] = useState('');
  const [availableFilaments, setAvailableFilaments] = useState<Filament[]>([]);
  const [filament, setFilament] = useState('');
  const [estimatedFilamentUsage, setEstimatedFilamentUsage] = useState('');
  const [showLowStockWarning, setShowLowStockWarning] = useState(false);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);
  const router = useRouter();

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotificationType(type);
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
  };

  const clearNotifications = () => {
    setError('');
    setSuccess('');
  };

  // Load available filaments when printer changes
  useEffect(() => {
    if (printer) {
      loadFilaments(printer);
      setFilament('');
      setEstimatedFilamentUsage('');
      setShowLowStockWarning(false);
      setAcknowledgedWarning(false);
    } else {
      setAvailableFilaments([]);
    }
  }, [printer]);

  // Check for low stock warning when filament or usage changes
  useEffect(() => {
    if (filament && estimatedFilamentUsage) {
      const selectedFilament = availableFilaments.find(f => f._id === filament);
      const usage = parseFloat(estimatedFilamentUsage);
      
      if (selectedFilament && !isNaN(usage) && selectedFilament.weight < usage) {
        setShowLowStockWarning(true);
        setAcknowledgedWarning(false);
      } else {
        setShowLowStockWarning(false);
        setAcknowledgedWarning(false);
      }
    }
  }, [filament, estimatedFilamentUsage, availableFilaments]);

  const loadFilaments = async (printerId: string) => {
    try {
      const res = await fetch(`/api/printers/${printerId}/filaments`);
      if (!res.ok) throw new Error('Failed to fetch filaments');
      const data = await res.json();
      setAvailableFilaments(data.filaments || []);
    } catch (err) {
      console.error('Error loading filaments:', err);
      showNotification('Nie udało się załadować filamentów', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    setIsSubmitting(true);

    if (!name || !googleDriveLink || !duration || !printer) {
      showNotification('Wypełnij wszystkie wymagane pola.', 'error');
      setIsSubmitting(false);
      return;
    }

    const durationNum = parseInt(duration, 10);
    if (isNaN(durationNum) || durationNum <= 0) {
      showNotification('Wprowadź poprawny czas trwania w minutach.', 'error');
      setIsSubmitting(false);
      return;
    }

    let filamentUsageNum = 0;
    if (estimatedFilamentUsage) {
      filamentUsageNum = parseFloat(estimatedFilamentUsage);
      if (isNaN(filamentUsageNum) || filamentUsageNum <= 0) {
        showNotification('Wprowadź poprawną ilość filamentu w gramach.', 'error');
        setIsSubmitting(false);
        return;
      }
    }

    // Check if user acknowledged low stock warning (only if filament is selected)
    if (filament && showLowStockWarning && !acknowledgedWarning) {
      showNotification('Musisz potwierdzić ostrzeżenie o niskim stanie filamentu.', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      const requestBody: any = { 
        name, 
        googleDriveLink, 
        duration: durationNum, 
        printer
      };
      
      // Add optional filament fields if provided
      if (filament) {
        requestBody.filament = filament;
      }
      if (estimatedFilamentUsage) {
        requestBody.estimatedFilamentUsage = filamentUsageNum;
      }
      
      const res = await fetch('/api/prints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        showNotification('Zadanie druku zostało dodane pomyślnie!', 'success');
        setTimeout(() => {
          router.push('/schedule');
        }, 2000);
      } else {
        const data = await res.json();
        showNotification(data.error || 'Nie udało się dodać zadania druku.', 'error');
      }
    } catch (err) {
      showNotification('Wystąpił nieoczekiwany błąd.', 'error');
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
        
        {(error || success) && (
          <Notification
            message={error || success}
            type={notificationType}
            onClose={clearNotifications}
          />
        )}
        
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
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
          
          {printer && (
            <div className="form-group">
              <label htmlFor="filament" className="form-label">
                Filament (opcjonalnie)
              </label>
              <select
                id="filament"
                value={filament}
                onChange={e => setFilament(e.target.value)}
                className="form-select"
              >
                <option value="">Wybierz filament (opcjonalnie)</option>
                {availableFilaments.map(f => (
                  <option key={f._id} value={f._id}>
                    {f.brand} - {f.color} {f.material} ({f.weight}g dostępne)
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {filament && (
            <div className="form-group">
              <label htmlFor="estimatedFilamentUsage" className="form-label">
                Szacowane zużycie filamentu (g)
              </label>
              <input
                type="number"
                id="estimatedFilamentUsage"
                value={estimatedFilamentUsage}
                onChange={(e) => setEstimatedFilamentUsage(e.target.value)}
                className="form-input"
                min="0.1"
                step="0.1"
                placeholder="np. 15.5"
              />
            </div>
          )}
          
          {showLowStockWarning && (
            <div style={{ 
              background: 'var(--warning)', 
              color: 'white', 
              padding: '1rem', 
              borderRadius: 'var(--radius)', 
              marginBottom: '1rem' 
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0' }}>⚠️ Ostrzeżenie o niskim stanie filamentu</h4>
              <p style={{ margin: '0 0 1rem 0' }}>
                Szacowane zużycie filamentu ({estimatedFilamentUsage}g) przekracza dostępną ilość ({availableFilaments.find(f => f._id === filament)?.weight}g). 
                Filament może się skończyć podczas druku.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  checked={acknowledgedWarning}
                  onChange={(e) => setAcknowledgedWarning(e.target.checked)}
                />
                Rozumiem ryzyko i chcę kontynuować
              </label>
            </div>
          )}
          
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

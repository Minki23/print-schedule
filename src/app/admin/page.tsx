'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';

interface User {
  _id: string;
  name: string;
  email: string;
  rank: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
}

interface Printer {
  _id: string;
  name: string;
  occupied: boolean;
  supportedFilamentDiameters?: number[];
  nozzleSize?: number;
  possibleFilaments?: Array<{
    _id: string;
    brand: string;
    color: string;
    material: string;
    diameter: number;
  }>;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [printers, setPrinters] = useState<Printer[]>([]);
  const [printerName, setPrinterName] = useState('');
  const [printerDiameters, setPrinterDiameters] = useState<number[]>([1.75]);
  const [printerNozzleSize, setPrinterNozzleSize] = useState(0.4);
  const [printerError, setPrinterError] = useState('');
  const [isPrinterLoading, setIsPrinterLoading] = useState(false);
  const [editingPrinter, setEditingPrinter] = useState<Printer | null>(null);
  const [showPrinterForm, setShowPrinterForm] = useState(false);

  useEffect(() => {
    if (session?.user.rank !== 'admin') {
      router.push('/');
    }
  }, [router, session]);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/users');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to fetch users');
        }
        const data = await res.json();
        setUsers(data.users || []);
      } catch (err: any) {
        setError(err.message);
      }
      setIsLoading(false);
    };

    if (session?.user.rank === 'admin') {
        fetchUsers();
    }
  }, [session]);

  // Fetch printers
  useEffect(() => {
    async function loadPrinters() {
      try {
        const res = await fetch('/api/printers');
        if (!res.ok) throw new Error('Failed to fetch printers');
        const data = await res.json();
        setPrinters(data.printers || []);
      } catch (err: any) {
        setPrinterError(err.message);
      }
    }
    if (session?.user.rank === 'admin') loadPrinters();
  }, [session]);

  const handleUserUpdate = async (userId: string, action: 'approve' | 'reject' | 'makeAdmin' | 'revokeAdmin') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${action} user`);
      }
      const updatedUsers = await Promise.all(users.map(async user => {
        if (user._id === userId) {
          const data = await res.json();
          return data.user;
        }
        return user;
      }).filter(Boolean)); 
      const updatedRes = await fetch('/api/admin/users');
      const updatedData = await updatedRes.json();
      setUsers(updatedData.users || []);

    } catch (err: any) {
      setError(err.message);
    }
  };

  // Handler to add a new printer
  const handleAddPrinter = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrinterError('');
    if (!printerName) {
      setPrinterError('Name is required');
      return;
    }
    setIsPrinterLoading(true);
    try {
      const url = editingPrinter ? `/api/printers/${editingPrinter._id}` : '/api/printers';
      const method = editingPrinter ? 'PATCH' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: printerName,
          supportedFilamentDiameters: printerDiameters,
          nozzleSize: printerNozzleSize
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save printer');
      }

      const { printers: updated } = await (await fetch('/api/printers')).json();
      setPrinters(updated || []);
      resetPrinterForm();
    } catch (err: any) {
      setPrinterError(err.message);
    } finally {
      setIsPrinterLoading(false);
    }
  };

  const resetPrinterForm = () => {
    setPrinterName('');
    setPrinterDiameters([1.75]);
    setPrinterNozzleSize(0.4);
    setEditingPrinter(null);
    setShowPrinterForm(false);
  };

  const handleEditPrinter = (printer: Printer) => {
    setEditingPrinter(printer);
    setPrinterName(printer.name);
    setPrinterDiameters(printer.supportedFilamentDiameters || [1.75]);
    setPrinterNozzleSize(printer.nozzleSize || 0.4);
    setShowPrinterForm(true);
  };

  const handleDeletePrinter = async (printerId: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę drukarkę?')) {
      return;
    }

    try {
      const res = await fetch(`/api/printers/${printerId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete printer');
      }

      const { printers: updated } = await (await fetch('/api/printers')).json();
      setPrinters(updated || []);
    } catch (err: any) {
      setPrinterError(err.message);
    }
  };

  const addDiameter = () => {
    const newDiameter = parseFloat(prompt('Podaj średnicę filamentu (mm):') || '');
    if (newDiameter && !printerDiameters.includes(newDiameter)) {
      setPrinterDiameters(prev => [...prev, newDiameter]);
    }
  };

  const removeDiameter = (diameter: number) => {
    if (printerDiameters.length > 1) {
      setPrinterDiameters(prev => prev.filter(d => d !== diameter));
    }
  };

  if (session?.user.rank !== 'admin') {
    return (
      <div className="schedule-background">
        <Navigation />
        <div className="loading">Brak dostępu.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="schedule-background">
        <Navigation />
        <div className="loading">Ładowanie użytkowników i drukarek...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="schedule-background">
        <Navigation />
        <div className="error">Błąd: {error}</div>
      </div>
    );
  }

  const pendingUsers = users.filter(user => user.status === 'pending');
  const approvedUsers = users.filter(user => user.status === 'approved');

  return (
    <div className="schedule-background">
      <Navigation/>
      <div className="schedule-content container">
        <header className="page-header">
          <h1 className="page-title">Panel administratora</h1>
        </header>

        <div className="admin-sections">
          <section className="admin-section">
            <h2 className="section-title">Wnioski o rejestracje</h2>
            {pendingUsers.length === 0 ? (
              <p className="section-empty">Brak wniosków.</p>
            ) : (
              <ul className="admin-list">
                {pendingUsers.map((user) => (
                  <li key={user._id} className="admin-card">
                    <div>
                      <p className="admin-card-text">{user.name} ({user.email})</p>
                    </div>
                    <div className="admin-actions">
                      <button onClick={() => handleUserUpdate(user._id, 'approve')} className="btn btn-success btn-sm">Zatwierdź</button>
                      <button onClick={() => handleUserUpdate(user._id, 'reject')} className="btn btn-danger btn-sm">Odrzuć</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-section">
            <h2 className="section-title">Zarządzaj użytkownikami</h2>
            {approvedUsers.length === 0 ? (
              <p className="section-empty">Brak użytkowników</p>
            ) : (
              <ul className="admin-list">
                {approvedUsers.map((user) => (
                  <li key={user._id} className="admin-card">
                    <div>
                      <p className="admin-card-text">{user.name} ({user.email}) - Ranga: {user.rank}</p>
                    </div>
                    <div className="admin-actions">
                      {user.rank === 'user' ? (
                        <button onClick={() => handleUserUpdate(user._id, 'makeAdmin')} className="btn btn-primary btn-sm">Nadaj uprawnienia admin</button>
                      ) : (
                        session?.user.id !== user._id ? (
                          <button onClick={() => handleUserUpdate(user._id, 'revokeAdmin')} className="btn btn-warning btn-sm">Odbierz uprawnienia admin</button>
                        ) : (
                          <span className="admin-badge">Administrator</span>
                        )
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="admin-section">
            <h2 className="section-title">Zarządzaj drukarkami</h2>
            <button
              onClick={() => setShowPrinterForm(true)}
              className="btn btn-primary"
            >
              Dodaj drukarkę
            </button>
            
            {showPrinterForm && (
              <div className="add-menu">
                <div className="add-menu-content">
                  <h3 className="form-title">
                    {editingPrinter ? 'Edytuj drukarkę' : 'Dodaj nową drukarkę'}
                  </h3>
                  <form onSubmit={handleAddPrinter} className="add-form">
                    <div className="form-group">
                      <label className="form-label">Nazwa drukarki</label>
                      <input
                        type="text"
                        className="form-input"
                        value={printerName}
                        onChange={(e) => setPrinterName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Rozmiar dyszy (mm)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-input"
                        value={printerNozzleSize}
                        onChange={(e) => setPrinterNozzleSize(parseFloat(e.target.value))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Obsługiwane średnice filamentu</label>
                      <div className="diameter-list">
                        {printerDiameters.map((diameter, index) => (
                          <div key={index} className="diameter-item">
                            <span>{diameter} mm</span>
                            {printerDiameters.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeDiameter(diameter)}
                                className="btn-remove"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addDiameter}
                          className="btn btn-secondary"
                        >
                          Dodaj średnicę
                        </button>
                      </div>
                    </div>

                    {printerError && <p className="error-message">{printerError}</p>}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPrinterLoading}
                        className="btn btn-success"
                      >
                        {isPrinterLoading ? 'Zapisywanie...' : (editingPrinter ? 'Zapisz zmiany' : 'Dodaj drukarkę')}
                      </button>
                      <button
                        type="button"
                        onClick={resetPrinterForm}
                        className="btn btn-secondary"
                      >
                        Anuluj
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="printers-grid">
              {printers.map(printer => (
                <div key={printer._id} className="printer-card">
                  <div className="printer-header">
                    <h3>{printer.name}</h3>
                    <span className={`status ${printer.occupied ? 'occupied' : 'available'}`}>
                      {printer.occupied ? 'Zajęta' : 'Dostępna'}
                    </span>
                  </div>
                  
                  <div className="printer-info">
                    <p><strong>Rozmiar dyszy:</strong> {printer.nozzleSize || 0.4} mm</p>
                    <p><strong>Obsługiwane średnice:</strong> {(printer.supportedFilamentDiameters || [1.75]).join(', ')} mm</p>
                    <p><strong>Dostępne filamenty:</strong> {printer.possibleFilaments?.length || 0}</p>
                  </div>

                  <div className="printer-actions">
                    <button
                      onClick={() => handleEditPrinter(printer)}
                      className="btn btn-secondary"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDeletePrinter(printer._id)}
                      className="btn btn-danger"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {printers.length === 0 && <p className="section-empty">Brak dodanych drukarek.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}

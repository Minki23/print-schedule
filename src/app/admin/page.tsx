'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navigation from '@/components/Navigation';
import '@/styles/loading.css';
import { ReactSVG } from 'react-svg';

interface User {
  _id: string;
  name: string;
  email: string;
  rank: 'user' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const [printers, setPrinters] = useState<{ _id: string; name: string; location: string }[]>([]);
  const [printerName, setPrinterName] = useState('');
  const [printerError, setPrinterError] = useState('');
  const [isPrinterLoading, setIsPrinterLoading] = useState(false);

  useEffect(() => {
    if (!session || session?.user.rank !== 'admin') {
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
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: printerName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add printer');
      }

      const { printers: updated } = await (await fetch('/api/printers')).json();
      setPrinters(updated || []);
      setPrinterName('');
    } catch (err: any) {
      setPrinterError(err.message);
    } finally {
      setIsPrinterLoading(false);
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
      <div className="loading">
        <ReactSVG src="/logo.svg" className='loading-logo'/>
        <div className="loading-spinner"></div>
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
            <form onSubmit={handleAddPrinter} className="admin-form">
              <input
                type="text"
                placeholder="Nazwa drukarki"
                value={printerName}
                onChange={e => setPrinterName(e.target.value)}
                className="search-bar"
                required
              />
              <button
                type="submit"
                disabled={isPrinterLoading}
                className="btn btn-success"
              >
                {isPrinterLoading ? 'Dodawanie...' : 'Dodaj drukarkę'}
              </button>
            </form>
            {printerError && <p className="error-message">{printerError}</p>}
            <ul className="admin-list">
              {printers.map(p => (
                <li key={p._id} className="admin-card">
                  <p className="admin-card-text">{p.name}</p>
                </li>
              ))}
              {printers.length === 0 && <p className="section-empty">Brak dodanych drukarek.</p>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

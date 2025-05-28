'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

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
    return <div className="flex justify-center items-center min-h-screen">Brak dostępu.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Ładowanie użytkowników i drukarek...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  const pendingUsers = users.filter(user => user.status === 'pending');
  const approvedUsers = users.filter(user => user.status === 'approved');

  return (
    <div className="container mx-auto p-4 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-8">Panel administratora</h1>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Wnioski o rejestracje</h2>
        {pendingUsers.length === 0 ? (
          <p>Brak wniosków.</p>
        ) : (
          <ul className="space-y-3">
            {pendingUsers.map((user) => (
              <li key={user._id} className="bg-white text-gray-700 p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700">{user.name} ({user.email})</p>
                </div>
                <div className="space-x-2">
                  <button onClick={() => handleUserUpdate(user._id, 'approve')} className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded text-sm">Approve</button>
                  <button onClick={() => handleUserUpdate(user._id, 'reject')} className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded text-sm">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Zarządzaj użytkownikami</h2>
        {approvedUsers.length === 0 ? (
          <p>Brak użytkwoników</p>
        ) : (
          <ul className="space-y-3">
            {approvedUsers.map((user) => (
              <li key={user._id} className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className=" text-gray-700 font-medium">{user.name} ({user.email}) - Ranga: {user.rank}</p>
                </div>
                <div className="space-x-2">
                  {user.rank === 'user' ? (
                    <button onClick={() => handleUserUpdate(user._id, 'makeAdmin')} className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm">Make Admin</button>
                  ) : (
                    session?.user.id !== user._id ? (
                      <button onClick={() => handleUserUpdate(user._id, 'revokeAdmin')} className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded text-sm">Revoke Admin</button>
                    ) : (
                      <span className=" text-gray-700 text-sm">Admin</span>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10 mb-10">
        <h2 className="text-2xl font-semibold mb-4">Zarządzaj drukarkami</h2>
        <form onSubmit={handleAddPrinter} className="mb-6 flex space-x-2">
          <input
            type="text"
            placeholder="Printer Name"
            value={printerName}
            onChange={e => setPrinterName(e.target.value)}
            className="px-3 py-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={isPrinterLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {isPrinterLoading ? 'Dodawanie...' : 'Dodaj drukarkę'}
          </button>
        </form>
        {printerError && <p className="text-red-500 mb-4">{printerError}</p>}
        <ul className="space-y-2">
          {printers.map(p => (
            <li key={p._id} className="bg-white text-gray-700 p-3 rounded shadow">
              {p.name}
            </li>
          ))}
          {printers.length === 0 && <p>Brak dodanych drukarek.</p>}
        </ul>
      </section>

    </div>
  );
}

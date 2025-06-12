'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

interface Print {
  _id: string;
  name: string;
  duration: number; // Total duration in minutes
  status: string;
  googleDriveLink: string;
  printer: { _id: string; name: string; location: string; occupied: boolean };
  timeRemaining?: number; // Calculated by API for 'printing' status, in minutes
  startedAt?: string; // Timestamp when print started
  scheduledBy: { name: string }; // Added to display who scheduled the print
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const [prints, setPrints] = useState<Print[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For initial page load
  const [error, setError] = useState('');
  const [startingPrintId, setStartingPrintId] = useState<string | null>(null); // For button loading state

  useEffect(() => {
    const fetchPrints = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await fetch('/api/prints');
        if (!res.ok) {
          throw new Error('Failed to fetch prints');
        }
        const data = await res.json();
        setPrints(data.prints || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching prints.');
      }
      setIsLoading(false);
    };
    fetchPrints();
  }, []);

  const printingPrints = prints.filter(p => p.status === 'printing');
  const pendingPrints = prints.filter(p => p.status === 'pending');
  const completedPrints = prints.filter(p => p.status === 'completed');
  const failedPrints = prints.filter(p => p.status === 'failed');

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen text-white">Ładowanie harmonogramu...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-white">Błąd: {error}</div>;
  }

  return (
    <div className="container mx-auto p-6 font-sans">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-extrabold text-white">Panel drukowania</h1>
        <div className="flex space-x-4">
          <Link href="/schedule/new" className="bg-indigo-600 text-white py-2 px-4 rounded shadow hover:bg-indigo-700">
            Dodaj nowe zadanie druku
          </Link>
          {session?.user.rank === 'admin' && (
            <Link href="/admin" className="bg-indigo-600 text-white py-2 px-4 rounded shadow hover:bg-indigo-700">
              Panel administratora
            </Link>)
        }
        </div>
      </header>

      {/* Currently Printing Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Aktualnie drukowane</h2>
        {printingPrints.length === 0 ? (
          <p className="text-white">Brak aktywnych druków.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printingPrints.map(print => (
              <div key={print._id} className="bg-blue-100 p-6 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold mb-2 truncate text-black">{print.name}</h3>
                <a href={print.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-2 block">{print.googleDriveLink}</a>
                <p className="text-sm mb-1 text-black">Drukarka: <span className="font-medium">{print.printer.name}</span></p>
                <p className="text-sm mb-1 text-black">Pozostały czas: <span className="font-medium">{typeof print.timeRemaining === 'number' ? print.timeRemaining : 'N/A'}</span></p>
                <p className="text-sm mb-1 text-black">Przewidywany czas zakończenia: <span className="font-medium">{print.startedAt ? new Date(new Date(print.startedAt).getTime() + print.duration * 60000).toLocaleTimeString() : 'N/A'}</span></p>
                <p className="text-xs mt-2 text-black">Dodane przez: {print.scheduledBy?.name || 'Nieznany'}</p>
                <div className="mt-2 space-x-2">
                  <button
                    onClick={async () => {
                      if (!confirm('Czy na pewno chcesz zatrzymać ten wydruk przed czasem?')) return;
                      const res = await fetch(`/api/prints/${print._id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'stop' }),
                      });
                      if (!res.ok) throw new Error('Failed to stop print');
                      const data = await (await fetch('/api/prints')).json();
                      setPrints(data.prints || []);
                    }}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 text-sm"
                  >
                    Zatrzymaj druk
                  </button>
                    {session?.user.rank === 'admin' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Czy na pewno chcesz usunąć ten wydruk?')) return;
                        const res = await fetch(`/api/prints/${print._id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Failed to delete print');
                        const data = await (await fetch('/api/prints')).json();
                        setPrints(data.prints || []);
                      }}
                      className="bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 text-sm"
                    >
                      Usuń
                    </button>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scheduled Prints Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Zaplanowane druki</h2>
        {pendingPrints.length === 0 ? (
          <p className="text-white">Brak zaplanowanych druków.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingPrints.map(print => {
              const isStartingThisPrint = startingPrintId === print._id;
              return (
                <div key={print._id} className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-2 truncate text-black">{print.name}</h3>
                  <a href={print.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-2 block">{print.googleDriveLink}</a>
                  <p className="text-sm mb-1 text-black">Drukarka: {print.printer.name}</p>
                  <p className="text-sm mb-1 text-black">Czas trwania: {print.duration} min</p>
                  <p className="text-xs mt-1 text-black">Dodane przez: {print.scheduledBy?.name || 'Nieznany'}</p>
                  {isStartingThisPrint ? (
                    <button disabled className="mt-2 bg-yellow-500 text-white py-1 px-3 rounded cursor-wait">
                      Startuję druk...
                    </button>
                  ) : print.printer.occupied ? (
                    <button disabled className="mt-2 mr-2 bg-gray-400 text-white py-1 px-3 rounded cursor-not-allowed">
                      Drukarka zajęta
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        setStartingPrintId(print._id);
                        setError(''); // Clear previous general errors
                        try {
                          const patchRes = await fetch(`/api/prints/${print._id}`, { method: 'PATCH' });
                          if (!patchRes.ok) {
                            let errorMsg = `Failed to start print. Status: ${patchRes.status}`;
                            try {
                              const errorData = await patchRes.json();
                              errorMsg = errorData.message || errorMsg;
                            } catch (e) { /* ignore if response is not json */ }
                            throw new Error(errorMsg);
                          }
                          // Successfully started, now refresh entire print list
                          const getRes = await fetch('/api/prints');
                          if (!getRes.ok) {
                            throw new Error('Failed to refresh print list after starting print.');
                          }
                          const data = await getRes.json();
                          setPrints(data.prints || []);
                        } catch (err: any) {
                          setError(err.message || 'An error occurred while starting the print.');
                        } finally {
                          setStartingPrintId(null);
                        }
                      }}
                      className="mt-2 bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                    >
                      Start Print
                    </button>
                  )}
                  {session?.user.rank === 'admin' && (
                    <button
                      onClick={async () => {
                        if (!confirm('Czy na pewno chcesz usunąć ten wydruk?')) return;
                        try {
                          const res = await fetch(`/api/prints/${print._id}`, { method: 'DELETE' });
                          if (!res.ok) throw new Error('Failed to delete print');
                          const data = await (await fetch('/api/prints')).json();
                          setPrints(data.prints || []);
                        } catch (err: any) {
                          setError(err.message || 'An error occurred');
                        }
                      }}
                      className="mt-2 bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 text-sm"
                    >
                      Usuń
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Prints Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Zakończone druki</h2>
        {completedPrints.length === 0 ? (
          <p className="text-white">Brak zakończonych druków.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedPrints.map(print => (
              <div key={print._id} className="bg-green-50 p-6 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold mb-2 truncate text-black">{print.name}</h3>
                <a href={print.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-2 block">{print.googleDriveLink}</a>
                <p className="text-sm mb-1 text-black">Drukarka: {print.printer.name}</p>
                <p className="text-sm mb-1 text-black">Czas trwania: {print.duration} min</p>
                <p className="text-xs mt-1 text-black">Dodane przez: {print.scheduledBy?.name || 'Nieznany'}</p>
                <span className="inline-block mt-2 bg-green-200 text-black py-1 px-2 rounded">Zakończone</span>
                {session?.user.rank === 'admin' && (
                  <button
                    onClick={async () => {
                      if (!confirm('Czy na pewno chcesz usunąć ten wydruk?')) return;
                      try {
                        const res = await fetch(`/api/prints/${print._id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Failed to delete print');
                        const data = await (await fetch('/api/prints')).json();
                        setPrints(data.prints || []);
                      } catch (err: any) {
                        setError(err.message || 'Wystąpił błąd');
                      }
                    }}
                    className="mt-2 bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 text-sm"
                  >
                    Usuń
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Failed Prints Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-white">Nieudane druki</h2>
        {failedPrints.length === 0 ? (
          <p className="text-white">Brak nieudanych druków.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {failedPrints.map(print => (
              <div key={print._id} className="bg-red-50 p-6 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold mb-2 truncate text-black">{print.name}</h3>
                <a href={print.googleDriveLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline mb-2 block">{print.googleDriveLink}</a>
                <p className="text-sm mb-1 text-black">Drukarka: {print.printer.name}</p>
                <p className="text-sm mb-1 text-black">Czas trwania: {print.duration} min</p>
                <p className="text-xs mt-1 text-black">Dodane przez: {print.scheduledBy?.name || 'Nieznany'}</p>
                <span className="inline-block mt-2 bg-red-200 text-black py-1 px-2 rounded">Nieudane</span>
                {session?.user.rank === 'admin' && (
                  <button
                    onClick={async () => {
                      if (!confirm('Czy na pewno chcesz usunąć ten wydruk?')) return;
                      try {
                        const res = await fetch(`/api/prints/${print._id}`, { method: 'DELETE' });
                        if (!res.ok) throw new Error('Failed to delete print');
                        const data = await (await fetch('/api/prints')).json();
                        setPrints(data.prints || []);
                      } catch (err: any) {
                        setError(err.message || 'An error occurred');
                      }
                    }}
                    className="mt-2 bg-gray-500 text-white py-1 px-3 rounded hover:bg-gray-600 text-sm"
                  >
                    Usuń
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

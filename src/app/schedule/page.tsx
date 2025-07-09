'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import PrintCard from '@/components/PrintCard';
import Navigation from '@/components/Navigation';

interface Print {
  _id: string;
  name: string;
  duration: number;
  status: string;
  googleDriveLink: string;
  printer: { _id: string; name: string; location: string; occupied: boolean };
  timeRemaining?: number;
  startedAt?: string;
  scheduledBy: { name: string };
}

export default function SchedulePage() {
  const { data: session } = useSession();
  const [prints, setPrints] = useState<Print[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [startingPrintId, setStartingPrintId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshPrints = async () => {
    try {
      const res = await fetch('/api/prints');
      if (!res.ok) throw new Error('Failed to refresh prints');
      const data = await res.json();
      setPrints(data.prints || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while refreshing prints.');
    }
  };

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
        const fetchedPrints = data.prints || [];
        
        const now = new Date();
        for (const print of fetchedPrints) {
          if (print.status === 'printing' && print.startedAt) {
            const completionTime = new Date(new Date(print.startedAt).getTime() + print.duration * 60000);
            if (now >= completionTime) {
              await fetch(`/api/prints/${print._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'complete' }),
              });
            }
          }
        }
        
        // Fetch prints again to get updated statuses
        const updatedRes = await fetch('/api/prints');
        const updatedData = await updatedRes.json();
        setPrints(updatedData.prints || []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching prints.');
      }
      setIsLoading(false);
    };
    
    fetchPrints();
    
    // Set up interval to check periodically
    const interval = setInterval(fetchPrints, 120000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Filter prints based on search term
  const filterPrints = (prints: Print[]) => {
    if (!searchTerm.trim()) return prints;
    
    const searchLower = searchTerm.toLowerCase();
    return prints.filter(print => 
      print.name.toLowerCase().includes(searchLower) ||
      print.printer.name.toLowerCase().includes(searchLower) ||
      print.scheduledBy?.name?.toLowerCase().includes(searchLower) ||
      print.status.toLowerCase().includes(searchLower)
    );
  };

  const allPrints = prints;
  const filteredPrintingPrints = filterPrints(allPrints.filter(p => p.status === 'printing'));
  const filteredPendingPrints = filterPrints(allPrints.filter(p => p.status === 'pending'));
  const filteredCompletedPrints = filterPrints(allPrints.filter(p => p.status === 'completed'));
  const filteredFailedPrints = filterPrints(allPrints.filter(p => p.status === 'failed'));

  if (isLoading) {
    return <div className="loading">Ładowanie harmonogramu...</div>;
  }

  if (error) {
    return <div className="error">Błąd: {error}</div>;
  }

  return (
    <div className="schedule-background">
      <Navigation />
      <div className="schedule-content container">
        <header className="page-header">
          <h1 className="page-title">Panel drukowania</h1>
          <input
            type="text"
            placeholder="Szukaj wydruków..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="header-actions">
            <Link href="/schedule/new" className="btn btn-primary">
              Dodaj nowe zadanie druku
            </Link>
          </div>
        </header>

        <div className="sections-container">
          {/* Currently Printing Section */}
          <section className="section">
            <h2 className="section-title">Aktualnie drukowane</h2>
            <div className="section-content">
              {filteredPrintingPrints.length === 0 ? (
                <p className="section-empty">
                  {searchTerm ? 'Brak wyników wyszukiwania.' : 'Brak aktywnych druków.'}
                </p>
              ) : (
                <div className="grid grid-cols-1">
                  {filteredPrintingPrints.map(print => (
                    <PrintCard
                      key={print._id}
                      print={print}
                      onUpdate={refreshPrints}
                      onError={setError}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

      {/* Scheduled Prints Section */}
      <section className="section">
        <h2 className="section-title">Zaplanowane druki</h2>
        <div className="section-content">
          {filteredPendingPrints.length === 0 ? (
            <p className="section-empty">
              {searchTerm ? 'Brak wyników wyszukiwania.' : 'Brak zaplanowanych druków.'}
            </p>
          ) : (
            <div className="grid grid-cols-1">
              {filteredPendingPrints.map(print => (
                <PrintCard
                  key={print._id}
                  print={print}
                  onUpdate={refreshPrints}
                  onError={setError}
                  isStarting={startingPrintId === print._id}
                  onStartingChange={setStartingPrintId}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Completed Prints Section */}
      <section className="section">
        <h2 className="section-title">Zakończone druki</h2>
        <div className="section-content">
          {filteredCompletedPrints.length === 0 ? (
            <p className="section-empty">
              {searchTerm ? 'Brak wyników wyszukiwania.' : 'Brak zakończonych druków.'}
            </p>
          ) : (
            <div className="grid grid-cols-1">
              {filteredCompletedPrints.map(print => (
                <PrintCard
                  key={print._id}
                  print={print}
                  onUpdate={refreshPrints}
                  onError={setError}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Failed Prints Section */}
      <section className="section">
        <h2 className="section-title">Nieudane druki</h2>
        <div className="section-content">
          {filteredFailedPrints.length === 0 ? (
            <p className="section-empty">
              {searchTerm ? 'Brak wyników wyszukiwania.' : 'Brak nieudanych druków.'}
            </p>
          ) : (
            <div className="grid grid-cols-1">
              {filteredFailedPrints.map(print => (
                <PrintCard
                  key={print._id}
                  print={print}
                  onUpdate={refreshPrints}
                  onError={setError}
                />
              ))}
            </div>
          )}
        </div>        
        </section>
        </div>
      </div>
    </div>
  );
}

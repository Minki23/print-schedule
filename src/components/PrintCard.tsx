'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

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

interface PrintCardProps {
  print: Print;
  onUpdate: () => void;
  onError: (error: string) => void;
  isStarting?: boolean;
  onStartingChange?: (printId: string | null) => void;
}

export default function PrintCard({ 
  print, 
  onUpdate, 
  onError, 
  isStarting = false, 
  onStartingChange 
}: PrintCardProps) {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCardClass = () => {
    switch (print.status) {
      case 'printing':
        return 'card card-printing';
      case 'completed':
        return 'card card-completed';
      case 'failed':
        return 'card card-failed';
      default:
        return 'card';
    }
  };

  const handleStartPrint = async () => {
    if (onStartingChange) onStartingChange(print._id);
    onError('');
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
      onUpdate();
    } catch (err: any) {
      onError(err.message || 'An error occurred while starting the print.');
    } finally {
      if (onStartingChange) onStartingChange(null);
    }
    setShowMenu(false);
  };

  const handleStopPrint = async () => {
    if (!confirm('Czy na pewno chcesz zatrzymać ten wydruk przed czasem?')) return;
    try {
      const res = await fetch(`/api/prints/${print._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
      if (!res.ok) throw new Error('Failed to stop print');
      onUpdate();
    } catch (err: any) {
      onError(err.message || 'An error occurred');
    }
    setShowMenu(false);
  };

  const handleRestartPrint = async () => {
    if (!confirm('Czy przenieść do zaplanowanych?')) return;
    try {
      const res = await fetch(`/api/prints/${print._id}`, { method: 'PATCH', body: JSON.stringify({ action: 'restart' }) });
      if (!res.ok) throw new Error('Failed to restart print');
      onUpdate();
    } catch (err: any) {
      onError(err.message || 'Wystąpił błąd');
    }
    setShowMenu(false);
  };

  const handleMarkAsFailed = async () => {
    if (!confirm('Czy oznaczyć jako nieudany?')) return;
    try {
       const res = await fetch(`/api/prints/${print._id}`, { method: 'PATCH', body: JSON.stringify({ action: 'markFailed' }) });
      if (!res.ok) throw new Error('Failed to mark as failed');
      onUpdate();
    } catch (err: any) {
      onError(err.message || 'Wystąpił błąd');
    }
    setShowMenu(false);
  };

  const handleDeletePrint = async () => {
    if (!confirm('Czy na pewno chcesz usunąć ten wydruk?')) return;
    try {
      const res = await fetch(`/api/prints/${print._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete print');
      onUpdate();
    } catch (err: any) {
      onError(err.message || 'An error occurred');
    }
    setShowMenu(false);
  };

  const renderActions = () => {
    const actions = [];

    // Actions based on status
    if (print.status === 'pending') {
      if (isStarting) {
        actions.push(
          <button key="starting" disabled className="menu-item" style={{ cursor: 'wait' }}>
            Startuję druk...
          </button>
        );
      } else if (print.printer.occupied) {
        actions.push(
          <button key="occupied" disabled className="menu-item" style={{ cursor: 'not-allowed' }}>
            Drukarka zajęta
          </button>
        );
      } else {
        actions.push(
          <button key="start" onClick={handleStartPrint} className="menu-item">
            Rozpocznij druk
          </button>
        );
      }
    }

    if (print.status === 'printing') {
      actions.push(
        <button key="stop" onClick={handleStopPrint} className="menu-item text-red-600">
          Zatrzymaj druk
        </button>
      );
    }

    if (print.status === 'completed') {
      actions.push(
        <button key="mark-failed" onClick={handleMarkAsFailed} className="menu-item text-orange-600">
          Oznacz jako nieudany
        </button>
      );
    }

    if (print.status === 'failed') {
      actions.push(
        <button key="restart" onClick={handleRestartPrint} className="menu-item text-green-600">
          Przenieś do zaplanowanych
        </button>
      );
    }

    // Admin actions
    if (session?.user.rank === 'admin') {
      actions.push(
        <button key="delete" onClick={handleDeletePrint} className="menu-item text-red-600">
          Usuń wydruk
        </button>
      );
    }

    return actions;
  };

  return (
    <div className={getCardClass()}>
      {/* Card Header with Menu */}
      <div className="card-header">
        <h3 className="card-title">{print.name}</h3>
        <div className="card-menu" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="menu-button"
            aria-label="Menu opcji"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="2" r="1.5"/>
              <circle cx="8" cy="8" r="1.5"/>
              <circle cx="8" cy="14" r="1.5"/>
            </svg>
          </button>
          {showMenu && (
            <div className="menu-dropdown">
              {renderActions()}
            </div>
          )}
        </div>
      </div>

      {/* Card Content */}
      <a href={print.googleDriveLink} target="_blank" rel="noopener noreferrer" className="link">
        <span>
          Link do dysku
          <svg xmlns="http://www.w3.org/2000/svg" className="link-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </a>

      <p className="card-text">Drukarka: <span className="font-medium">{print.printer.name}</span></p>
      <p className="card-text">Czas trwania: {print.duration} min</p>
      
      {print.status === 'printing' && (
        <>
          <p className="card-text">Pozostały czas: <span className="font-medium">{typeof print.timeRemaining === 'number' ? print.timeRemaining : 'N/A'}</span></p>
          <p className="card-text">Przewidywany czas zakończenia: <span className="font-medium">{print.startedAt ? new Date(new Date(print.startedAt).getTime() + print.duration * 60000).toLocaleTimeString() : 'N/A'}</span></p>
        </>
      )}
      
      <p className="card-text-sm">Dodane przez: {print.scheduledBy?.name || 'Nieznany'}</p>

      {/* Status Badge */}
      {print.status === 'completed' && (
        <span className="status-badge status-completed">Zakończone</span>
      )}
      {print.status === 'failed' && (
        <span className="status-badge status-failed">Nieudane</span>
      )}
      {print.status === 'printing' && (
        <span className="status-badge status-printing">Drukowanie</span>
      )}
    </div>
  );
}

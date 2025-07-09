'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function Navigation() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  if (!session) {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <Link href="/schedule" className="nav-logo">
            Print Schedule
          </Link>
        </div>
        <div className="nav-actions">
          <span className="nav-user">Witaj, {session.user.name}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn btn-secondary btn-sm"
          >
            Wyloguj się
          </button>
          {window.innerWidth > 640 && (
            <>
              <Link href="/schedule" className="btn btn-primary btn-sm">Harmonogram</Link>
              <Link href="/filaments" className="btn btn-primary btn-sm">Filamenty</Link>
              {(session.user.rank === 'admin') && <Link href="/admin" className="btn btn-primary btn-sm">Panel Admina</Link>}
            </>
          )}
          {window.innerWidth < 640 && (
            <>
            {showMenu && (
                <div className="nav-dropdown">
                  <Link href="/schedule" className="btn btn-primary btn-sm">Harmonogram</Link>
                  <Link href="/filaments" className="btn btn-primary btn-sm">Filamenty</Link>
                  {(session.user.rank === 'admin') && <Link href="/admin" className="btn btn-primary btn-sm">Panel Admina</Link>}
                </div>
              )}
              <button onClick={() => setShowMenu(!showMenu)} className='nav-toggle'>
                |||
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

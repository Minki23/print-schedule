'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navigation() {
  const { data: session } = useSession();

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
        </div>
      </div>
    </nav>
  );
}

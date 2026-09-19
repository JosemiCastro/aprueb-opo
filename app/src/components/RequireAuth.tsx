import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';
import Login from '../views/auth/Login';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="screen">
        <p className="placeholder">Cargando…</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <>{children}</>;
}

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { link, useHashRoute } from '../lib/router';
import { useAuth } from '../lib/auth';

export function Header({ title, backTo }: { title: string; backTo?: string }) {
  const { user, loading, logout } = useAuth();
  return (
    <header className="header">
      {backTo ? (
        <a className="back" href={link(backTo)} aria-label="Volver">
          ←
        </a>
      ) : null}
      <img className="brand-logo" src="/logo.png" alt="" aria-hidden="true" />
      <h1 className="header-title">{title}</h1>
      {!loading && user ? (
        <div className="header-user">
          <span className="user-chip">{user}</span>
          <button
            type="button"
            className="link-button"
            onClick={logout}
            aria-label="Cerrar sesión"
          >
            Salir
          </button>
        </div>
      ) : null}
    </header>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  const v = Math.max(0, Math.min(100, pct));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="progress-fill" style={{ width: `${v}%` }} />
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Btn({ variant = 'primary', className, ...rest }: BtnProps) {
  const cls = `btn btn-${variant}` + (className ? ` ${className}` : '');
  return <button className={cls} {...rest} />;
}

export function Card({ children }: { children: ReactNode }) {
  return <div className="card">{children}</div>;
}

export function TemaRow({
  to,
  title,
  sub,
  pct,
}: {
  to: string;
  title: string;
  sub?: string;
  pct?: number;
}) {
  return (
    <a className="tema-row" href={link(to)}>
      <div className="tema-row-main">
        <div className="tema-row-title">{title}</div>
        {sub ? <div className="tema-row-sub">{sub}</div> : null}
      </div>
      {pct !== undefined ? <div className="tema-row-pct">{pct}%</div> : null}
      <span className="tema-row-arrow" aria-hidden="true">
        ›
      </span>
    </a>
  );
}

/* ---------- Navegación principal móvil (barra inferior) ---------- */

interface NavItem {
  key: string;
  label: string;
  icon: string;
  to: string;
  active: boolean;
}

// El destino de "Temario" depende de la oposición que se esté viendo.
function temarioPath(path: string): string {
  if (path.startsWith('/a2')) return '/a2/temario';
  const mOpo = path.match(/^\/opo\/([A-Za-z0-9-]+)/);
  if (mOpo) return `/opo/${mOpo[1]}/temario`;
  return '/c1/temario';
}

// ¿A qué oposición pertenece la ruta actual? (para el estado activo)
function opoDePath(path: string): string | null {
  if (path.startsWith('/c1')) return 'HUE-C1';
  if (path.startsWith('/a2')) return 'HUE-A2';
  const m = path.match(/^\/opo\/([A-Za-z0-9-]+)/);
  return m ? m[1] : null;
}

export function BottomNav() {
  const path = useHashRoute();
  // Fuera de la app autenticada no hay navegación.
  if (path === '/login' || path === '/register') return null;

  const enTemario = /^(\/(c1|a2)|(\/opo\/[A-Za-z0-9-]+))\/temario/.test(path);
  const opoActual = opoDePath(path);
  const items: NavItem[] = [
    { key: 'home', label: 'Inicio', icon: '🏠', to: '/', active: path === '/' },
    {
      key: 'opos',
      label: 'Oposiciones',
      icon: '🗂️',
      to: '/oposiciones',
      active: path === '/oposiciones' || (opoActual !== null && !enTemario && path !== '/'),
    },
    {
      key: 'temario',
      label: 'Temario',
      icon: '📖',
      to: temarioPath(path),
      active: enTemario,
    },
    {
      key: 'progreso',
      label: 'Progreso',
      icon: '📊',
      to: '/progreso',
      active: path === '/progreso',
    },
  ];

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map((it) => (
        <a
          key={it.key}
          className={`bottom-nav-item${it.active ? ' active' : ''}`}
          href={link(it.to)}
          aria-current={it.active ? 'page' : undefined}
        >
          <span className="nav-ico" aria-hidden="true">
            {it.icon}
          </span>
          <span className="nav-label">{it.label}</span>
        </a>
      ))}
    </nav>
  );
}

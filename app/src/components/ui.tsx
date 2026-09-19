import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { link } from '../lib/router';
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

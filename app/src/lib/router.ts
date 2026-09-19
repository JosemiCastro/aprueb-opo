import { useEffect, useState } from 'react';

function currentPath(): string {
  const h = window.location.hash;
  if (h.startsWith('#')) return h.slice(1) || '/';
  return '/';
}

// Path sin '#', p.ej. '/c1/tema/T05'. Se actualiza al cambiar el hash.
export function useHashRoute(): string {
  const [path, setPath] = useState<string>(() => currentPath());
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return path;
}

export function navigate(path: string): void {
  window.location.hash = path;
}

export function link(path: string): string {
  return '#' + path;
}

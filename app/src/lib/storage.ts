import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { ProgressState } from '../types';
import { emptyProgress } from './progress';

const KEY = 'oposdipu-progress-v1';

function isValid(v: unknown): v is ProgressState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.qa === 'object' &&
    o.qa !== null &&
    Array.isArray(o.sessions) &&
    typeof o.checks === 'object' &&
    o.checks !== null
  );
}

// Lee el progreso de localStorage; fallback a emptyProgress()
export function loadProgress(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

// Persiste el progreso en localStorage
export function saveProgress(p: ProgressState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // almacenamiento no disponible (modo privado, SSR, etc.): se ignora
  }
}

// Hook: estado de progreso que se persiste automáticamente al cambiar
export function useProgress(): [ProgressState, Dispatch<SetStateAction<ProgressState>>] {
  const [p, setP] = useState<ProgressState>(() => loadProgress());
  useEffect(() => {
    saveProgress(p);
  }, [p]);
  return [p, setP];
}

/* ---------- Temas del temario marcados como estudiados ---------- */

const KEY_TEMAS = 'oposdipu-temas-estudiados-v1';

// Conjunto de ids de temario ("HUE-C1-T01") marcados como estudiados.
export type TemasEstudiados = Record<string, true>;

function isValidTemas(v: unknown): v is TemasEstudiados {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  return Object.values(v as Record<string, unknown>).every((x) => x === true);
}

export function loadTemasEstudiados(): TemasEstudiados {
  try {
    const raw = localStorage.getItem(KEY_TEMAS);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isValidTemas(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveTemasEstudiados(v: TemasEstudiados): void {
  try {
    localStorage.setItem(KEY_TEMAS, JSON.stringify(v));
  } catch {
    // almacenamiento no disponible: se ignora
  }
}

// Puro y testeable: marca/desmarca un tema (inmutable)
export function setTemaEstudiado(
  prev: TemasEstudiados,
  id: string,
  val: boolean,
): TemasEstudiados {
  if (val) {
    if (prev[id]) return prev;
    return { ...prev, [id]: true };
  }
  if (!prev[id]) return prev;
  const next = { ...prev };
  delete next[id];
  return next;
}

export function esTemaEstudiado(v: TemasEstudiados, id: string): boolean {
  return v[id] === true;
}

// Hook: conjunto de estudiados persistido en localStorage
export function useTemasEstudiados(): [
  TemasEstudiados,
  (id: string, val: boolean) => void,
] {
  const [v, setV] = useState<TemasEstudiados>(() => loadTemasEstudiados());
  useEffect(() => {
    saveTemasEstudiados(v);
  }, [v]);
  const toggle = (id: string, val: boolean) =>
    setV((prev) => setTemaEstudiado(prev, id, val));
  return [v, toggle];
}

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

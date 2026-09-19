import type { ProgressState, QAStat, SessionRec } from '../types';

// Estado inicial vacío
export function emptyProgress(): ProgressState {
  return { qa: {}, sessions: [], checks: {} };
}

// Registra una respuesta (inmutable: devuelve un nuevo estado)
export function recordAnswer(p: ProgressState, qid: string, ok: boolean): ProgressState {
  const prev: QAStat = p.qa[qid] ?? { ok: 0, ko: 0, last: 0 };
  const next: QAStat = {
    ok: prev.ok + (ok ? 1 : 0),
    ko: prev.ko + (ok ? 0 : 1),
    last: Date.now(),
  };
  return { ...p, qa: { ...p.qa, [qid]: next } };
}

// Añade un registro de sesión (inmutable)
export function recordSession(p: ProgressState, s: SessionRec): ProgressState {
  return { ...p, sessions: [...p.sessions, s] };
}

// Marca/desmarca un item del checklist de un esquema (inmutable)
export function setCheck(p: ProgressState, esquemaId: string, idx: number, val: boolean): ProgressState {
  const prev = p.checks[esquemaId] ?? [];
  const next = prev.slice();
  next[idx] = val;
  return { ...p, checks: { ...p.checks, [esquemaId]: next } };
}

// { pct, done, total } donde done = preguntas con algún intento
export function masteryPct(p: ProgressState, qids: string[]): { pct: number; done: number; total: number } {
  const total = qids.length;
  if (total === 0) return { pct: 0, done: 0, total: 0 };
  const done = qids.filter((id) => {
    const s = p.qa[id];
    return s !== undefined && s.ok + s.ko > 0;
  }).length;
  return { pct: Math.round((done / total) * 100), done, total };
}

// Dominada: ok >= 2 y ok > ko
export function isDominated(p: ProgressState, qid: string): boolean {
  const s = p.qa[qid];
  return s !== undefined && s.ok >= 2 && s.ok > s.ko;
}

// Ids con fallos (ko > 0) que no están dominadas
export function failedIds(p: ProgressState): string[] {
  return Object.entries(p.qa)
    .filter(([, s]) => s.ko > 0 && !(s.ok >= 2 && s.ok > s.ko))
    .map(([id]) => id);
}

// Nota sobre 10 con 1 decimal
export function grade(aciertos: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((aciertos / total) * 100) / 10;
}

function dayStr(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// Días consecutivos con >= 1 sesión, contando hacia atrás desde hoy
export function streakDays(p: ProgressState): number {
  const days = new Set(p.sessions.map((s) => s.date));
  let streak = 0;
  const d = new Date();
  for (;;) {
    if (days.has(dayStr(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

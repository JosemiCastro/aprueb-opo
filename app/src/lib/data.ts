import type { Esquema, Question, TemaMeta } from '../types';
import temasJson from '../data/temas.json';

// Normaliza el campo `tema` de los JSON a IDs 'T01' / 'E05'.
// - número 1 -> 'T01' (temas comunes)
// - "E01" / "e1" -> 'E01' (temas específicos)
function normTemaId(t: string | number): string {
  if (typeof t === 'number') return 'T' + String(t).padStart(2, '0');
  const s = t.trim().toUpperCase();
  const m = s.match(/^([TE]?)(\d{1,2})$/);
  if (m) return (m[1] || 'T') + m[2].padStart(2, '0');
  return s;
}

// import.meta.glob con eager: cada módulo JSON llega como { default: <contenido> }
function globJson<T>(mods: Record<string, unknown>): T[] {
  const out: T[] = [];
  for (const mod of Object.values(mods)) {
    const data = (mod as { default?: unknown }).default ?? mod;
    if (Array.isArray(data)) out.push(...(data as T[]));
    else out.push(data as T);
  }
  return out;
}

export const temas: TemaMeta[] = (temasJson as TemaMeta[]).slice();

const preguntas: Question[] = globJson<Question>(
  import.meta.glob('../data/c1/*.json', { eager: true }) as Record<string, unknown>,
);

const esquemas: Esquema[] = globJson<Esquema>(
  import.meta.glob('../data/a2/*.json', { eager: true }) as Record<string, unknown>,
);

export function temasDe(perfil: 'c1' | 'a2'): TemaMeta[] {
  return temas.filter((t) => t.perfil === perfil);
}

export function preguntasDeTema(temaId: string): Question[] {
  return preguntas.filter((q) => normTemaId(q.tema) === temaId);
}

export function todasPreguntas(): Question[] {
  return preguntas.slice();
}

export function esquemaDeTema(temaId: string): Esquema {
  const e = esquemas.find((s) => normTemaId(s.tema) === temaId);
  if (e) return e;
  // Marcador vacío: nunca debería ocurrir con datos generados correctamente.
  return { id: temaId, perfil: ['a2'], tema: temaId, titulo: temaId, puntos_clave: [], checklist: [] };
}

export function todosEsquemas(): Esquema[] {
  return esquemas.slice();
}

export function questionIdsDeTema(temaId: string): string[] {
  return preguntasDeTema(temaId).map((q) => q.id);
}

export function tituloTema(perfil: 'c1' | 'a2', temaId: string): string {
  const t = temas.find((x) => x.perfil === perfil && x.id === temaId);
  return t ? t.titulo : temaId;
}

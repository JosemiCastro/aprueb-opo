import type { Esquema, Oposicion, OposicionId, Question, TemaMeta } from '../types';
import temasJson from '../data/temas.json';
import oposicionesJson from '../data/oposiciones.json';

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

export const oposiciones: Oposicion[] = (oposicionesJson as Oposicion[]).slice();

export function oposicionDe(id: OposicionId): Oposicion {
  const o = oposiciones.find((x) => x.id === id);
  if (!o) throw new Error(`Oposición desconocida: ${id}`);
  return o;
}

/** Ruta base de la oposición: '/c1' y '/a2' se mantienen; el resto va a '/opo/:id'. */
export function baseDeOpo(id: OposicionId): string {
  if (id === 'HUE-C1') return '/c1';
  if (id === 'HUE-A2') return '/a2';
  return `/opo/${id}`;
}

/** Etiqueta corta para la oposición, p. ej. 'C1 · Cádiz'. */
export function etiquetaOpo(id: OposicionId): string {
  const o = oposicionDe(id);
  return `${o.grupo} · ${o.diputacion}`;
}

/** Etiqueta de la entidad convocante: 'Diputación de Huelva', 'RTVA / Canal Sur'… */
export function etiquetaEntidad(diputacion: string): string {
  if (diputacion === 'Canal Sur / RTVA') return 'RTVA / Canal Sur';
  return `Diputación de ${diputacion}`;
}

// Temas de Huelva (temas.json) + fragmentos de las nuevas oposiciones
// (app/src/data/<dir>/_temas.json).
export const temas: TemaMeta[] = [
  ...(temasJson as TemaMeta[]),
  ...globJson<TemaMeta>(
    import.meta.glob('../data/*/_temas.json', { eager: true }) as Record<string, unknown>,
  ),
];

/** Oposición a la que pertenece un tema (las de Huelva se deducen del perfil). */
export function oposicionDeTema(t: TemaMeta): OposicionId {
  if (t.oposicion) return t.oposicion;
  return t.perfil === 'a2' ? 'HUE-A2' : 'HUE-C1';
}

export function temasDeOpo(opoId: OposicionId): TemaMeta[] {
  return temas.filter((t) => oposicionDeTema(t) === opoId);
}

// Compatibilidad: perfil 'c1'/'a2' de Huelva.
export function temasDe(perfil: 'c1' | 'a2'): TemaMeta[] {
  return temasDeOpo(perfil === 'c1' ? 'HUE-C1' : 'HUE-A2');
}

const preguntas: Question[] = [
  ...globJson<Question>(
    import.meta.glob('../data/c1/HUE-C1-*.json', { eager: true }) as Record<string, unknown>,
  ),
  ...globJson<Question>(
    import.meta.glob('../data/cad-c2/CAD-C2-*.json', { eager: true }) as Record<string, unknown>,
  ),
  ...globJson<Question>(
    import.meta.glob('../data/gra-c1/GRA-C1-*.json', { eager: true }) as Record<string, unknown>,
  ),
  ...globJson<Question>(
    import.meta.glob('../data/sev-a1/SEV-A1-*.json', { eager: true }) as Record<string, unknown>,
  ),
  ...globJson<Question>(
    import.meta.glob('../data/csur-red/CSUR-RED-*.json', { eager: true }) as Record<string, unknown>,
  ),
];

const esquemas: Esquema[] = globJson<Esquema>(
  import.meta.glob('../data/a2/*.json', { eager: true }) as Record<string, unknown>,
);

/** Los IDs de pregunta llevan el prefijo de la oposición ('HUE-C1-…', 'CAD-C2-…'). */
function esDeOpo(q: Question, opoId: OposicionId): boolean {
  return q.id.startsWith(`${opoId}-`);
}

export function preguntasDeTema(temaId: string, opoId?: OposicionId): Question[] {
  return preguntas.filter(
    (q) => normTemaId(q.tema) === temaId && (!opoId || esDeOpo(q, opoId)),
  );
}

export function todasPreguntas(opoId?: OposicionId): Question[] {
  return opoId ? preguntas.filter((q) => esDeOpo(q, opoId)) : preguntas.slice();
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

export function questionIdsDeTema(temaId: string, opoId?: OposicionId): string[] {
  return preguntasDeTema(temaId, opoId).map((q) => q.id);
}

export function tituloTema(opoId: OposicionId, temaId: string): string {
  const t = temas.find((x) => oposicionDeTema(x) === opoId && x.id === temaId);
  return t ? t.titulo : temaId;
}

/**
 * Normaliza el `perfil` guardado en sesiones antiguas ('c1'/'a2')
 * al OposicionId actual. Las sesiones nuevas ya guardan el OposicionId.
 */
export function opoDeSesion(perfil: string): OposicionId {
  if (perfil === 'c1') return 'HUE-C1';
  if (perfil === 'a2') return 'HUE-A2';
  const o = oposiciones.find((x) => x.id === perfil);
  return o ? o.id : 'HUE-C1';
}

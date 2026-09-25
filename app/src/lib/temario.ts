import type { OposicionId, TemaDesarrollado } from '../types';

// Carga perezosa de los JSON del temario desarrollado. Cada entrada es una
// función () => Promise<{ default: TemaDesarrollado }>.
const modulosPorOpo: Record<OposicionId, Record<string, () => Promise<unknown>>> = {
  'HUE-C1': import.meta.glob('../data/c1/temario/*.json'),
  'HUE-A2': import.meta.glob('../data/a2/temario/*.json'),
  'CAD-C2': import.meta.glob('../data/cad-c2/temario/*.json'),
  'GRA-C1': import.meta.glob('../data/gra-c1/temario/*.json'),
  'SEV-A1': import.meta.glob('../data/sev-a1/temario/*.json'),
  'CSUR-RED': import.meta.glob('../data/csur-red/temario/*.json'),
  'CSUR-PRO': import.meta.glob('../data/csur-pro/temario/*.json'),
  'CSUR-AYP': import.meta.glob('../data/csur-ayp/temario/*.json'),
  'CSUR-PPR': import.meta.glob('../data/csur-ppr/temario/*.json'),
};

function esTemaDesarrollado(v: unknown): v is TemaDesarrollado {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.titulo === 'string' &&
    typeof o.numero === 'number' &&
    (o.tipo === 'comun' || o.tipo === 'especifico') &&
    Array.isArray(o.secciones)
  );
}

function ordenTemario(a: TemaDesarrollado, b: TemaDesarrollado): number {
  if (a.tipo !== b.tipo) return a.tipo === 'comun' ? -1 : 1;
  return a.numero - b.numero;
}

async function cargarTodos(opoId: OposicionId): Promise<TemaDesarrollado[]> {
  const mods = modulosPorOpo[opoId];
  const temas: TemaDesarrollado[] = [];
  await Promise.all(
    Object.values(mods).map(async (cargar) => {
      try {
        const mod = (await cargar()) as { default?: unknown };
        const data = mod.default ?? mod;
        if (esTemaDesarrollado(data)) {
          temas.push({
            ...data,
            relacionados: Array.isArray(data.relacionados)
              ? data.relacionados.filter((r): r is string => typeof r === 'string')
              : [],
          });
        }
      } catch {
        // Un JSON corrupto no tumba la lista: se ignora ese tema.
      }
    }),
  );
  return temas.sort(ordenTemario);
}

// Caché en memoria: cada temario solo se lee de disco/red la primera vez.
const cache: Partial<Record<OposicionId, Promise<TemaDesarrollado[]>>> = {};

/** Todos los temas desarrollados de la oposición, ordenados: comunes y luego específicos. */
export function listarTemario(opoId: OposicionId): Promise<TemaDesarrollado[]> {
  if (!cache[opoId]) cache[opoId] = cargarTodos(opoId);
  return cache[opoId];
}

/** Un tema desarrollado por su id (p. ej. "CAD-C2-T01"), o null si no existe. */
export async function obtenerTema(
  opoId: OposicionId,
  id: string,
): Promise<TemaDesarrollado | null> {
  const temas = await listarTemario(opoId);
  return temas.find((t) => t.id === id) ?? null;
}

/** Resuelve los ids de `relacionados` a temas existentes (para el bloque "Ver también"). */
export async function temasRelacionados(
  opoId: OposicionId,
  tema: TemaDesarrollado,
): Promise<TemaDesarrollado[]> {
  const temas = await listarTemario(opoId);
  const porId = new Map(temas.map((t) => [t.id, t]));
  const out: TemaDesarrollado[] = [];
  for (const rid of tema.relacionados) {
    const r = porId.get(rid);
    if (r && r.id !== tema.id && !out.includes(r)) out.push(r);
  }
  return out;
}

/** Solo para tests: vacía la caché en memoria. */
export function _resetCacheTemario(): void {
  for (const k of Object.keys(cache) as OposicionId[]) delete cache[k];
}

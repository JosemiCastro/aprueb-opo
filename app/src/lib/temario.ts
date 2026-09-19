import type { TemaDesarrollado } from '../types';

// Carga perezosa de los JSON del temario desarrollado (generados por workers
// en paralelo). Cada entrada es una función () => Promise<{ default: TemaDesarrollado }>.
const modulosC1 = import.meta.glob('../data/c1/temario/*.json');
const modulosA2 = import.meta.glob('../data/a2/temario/*.json');

type Modulos = Record<string, () => Promise<unknown>>;

function modulosDe(perfil: 'c1' | 'a2'): Modulos {
  return (perfil === 'c1' ? modulosC1 : modulosA2) as Modulos;
}

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

async function cargarTodos(perfil: 'c1' | 'a2'): Promise<TemaDesarrollado[]> {
  const mods = modulosDe(perfil);
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

// Caché en memoria: la lista solo se lee de disco/red la primera vez.
const cache: Partial<Record<'c1' | 'a2', Promise<TemaDesarrollado[]>>> = {};

/** Todos los temas desarrollados del perfil, ordenados: comunes y luego específicos. */
export function listarTemario(perfil: 'c1' | 'a2'): Promise<TemaDesarrollado[]> {
  if (!cache[perfil]) cache[perfil] = cargarTodos(perfil);
  return cache[perfil];
}

/** Un tema desarrollado por su id (p. ej. "HUE-C1-T01"), o null si no existe. */
export async function obtenerTema(
  perfil: 'c1' | 'a2',
  id: string,
): Promise<TemaDesarrollado | null> {
  const temas = await listarTemario(perfil);
  return temas.find((t) => t.id === id) ?? null;
}

/** Resuelve los ids de `relacionados` a temas existentes (para el bloque "Ver también"). */
export async function temasRelacionados(
  perfil: 'c1' | 'a2',
  tema: TemaDesarrollado,
): Promise<TemaDesarrollado[]> {
  const temas = await listarTemario(perfil);
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
  delete cache.c1;
  delete cache.a2;
}

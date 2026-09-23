import type { OposicionId } from '../../types';
import { oposicionDe } from '../../lib/data';

/** Props comunes de las vistas de una oposición con formato "preguntas". */
export interface OpoProps {
  opoId: OposicionId;
  /** Ruta base: '/c1' para Huelva C1, '/opo/CAD-C2'… para las nuevas. */
  base: string;
}

/** Título corto de la oposición, p. ej. 'C1 · Administrativo/a'. */
export function tituloOpo(opoId: OposicionId): string {
  const o = oposicionDe(opoId);
  return `${o.grupo} · ${o.cuerpo}`;
}

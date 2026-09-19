// Parseo de citas de artículos ("art. 1.3", "arts. 68, 71 y 82"...).
// Debe mantenerse en sintonía con server/lib/articulos.js (parseCita).
import type { ReactNode } from 'react';
import { CitaPill } from '../components/CitaArticulo';

export interface RefArticulo {
  numero: number;
  sub: string;
}

const MAX_ARTICULOS = 40;

/** Devuelve las referencias a artículos de la cita, o null si no es pulsable. */
export function parseCita(cita: string): RefArticulo[] | null {
  if (!cita || typeof cita !== 'string') return null;
  const pref = cita.trim().match(/^arts?\.\s*(.+)$/i);
  if (!pref) return null;

  const refs: RefArticulo[] = [];
  for (const segRaw of pref[1].split(';')) {
    const seg = segRaw
      .trim()
      .replace(/^arts?\.\s*/i, '')
      .replace(/\s+y\s+/gi, ',')
      .replace(/\s+a\s+/gi, '-');
    for (const tokRaw of seg.split(',')) {
      const tok = tokRaw.replace(/\s+/g, '');
      if (!tok) continue;
      const rango = tok.match(/^(\d+)-(\d+)$/);
      if (rango) {
        const a = Number(rango[1]);
        const b = Number(rango[2]);
        if (b > a && b - a <= MAX_ARTICULOS) {
          for (let n = a; n <= b && refs.length < MAX_ARTICULOS; n++) {
            refs.push({ numero: n, sub: '' });
          }
        } else if (a) {
          refs.push({ numero: a, sub: '' });
        }
        continue;
      }
      const num = tok.match(/^(\d+)(.*)$/);
      if (num) {
        const sub = num[2].replace(/^[.\s]+|[)\s.]+$/g, '');
        refs.push({ numero: Number(num[1]), sub });
      }
    }
  }
  if (refs.length === 0) return null;
  const vistos = new Set<number>();
  const out: RefArticulo[] = [];
  for (const r of refs.sort((x, y) => x.numero - y.numero)) {
    if (!vistos.has(r.numero)) {
      vistos.add(r.numero);
      out.push(r);
    }
  }
  return out.slice(0, MAX_ARTICULOS);
}

/* ---------- Render de texto con citas ---------- */

// Marcadores en línea: `[[ley | articulo]]`, `**negrita**`, `*cursiva*`.
const INLINE_SRC = String.raw`\[\[[^\][]*?\]\]|\*\*(.+?)\*\*|\*([^*]+?)\*`;
const LIST_ITEM_RE = /^-\s+/;
const ORDERED_RE = /^\d+\.\s+/;

/**
 * Parsea el formato en línea de un fragmento: sustituye cada
 * `[[ley | articulo]]` por un <CitaPill/> y aplica **negrita** / *cursiva*.
 * Un marcador mal formado (sin `]]` o sin `|`) se deja como texto plano.
 */
function parseInline(texto: string, base: string): ReactNode[] {
  // RegExp por invocación: la función es recursiva y no puede compartir lastIndex.
  const re = new RegExp(INLINE_SRC, 'g');
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > last) out.push(texto.slice(last, m.index));
    const tok = m[0];
    const key = `${base}-${n++}`;
    if (tok.startsWith('[[')) {
      const inner = tok.slice(2, -2);
      const bar = inner.indexOf('|');
      const ley = bar === -1 ? '' : inner.slice(0, bar).trim();
      const articulo = bar === -1 ? '' : inner.slice(bar + 1).trim();
      if (!ley || !articulo) {
        out.push(tok); // mal formado: texto plano
      } else {
        out.push(<CitaPill key={key} ley={ley} articulo={articulo} />);
      }
    } else if (tok.startsWith('**')) {
      out.push(<strong key={key}>{parseInline(m[1], key)}</strong>);
    } else {
      out.push(<em key={key}>{parseInline(m[2], key)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < texto.length) out.push(texto.slice(last));
  return out;
}

/**
 * Convierte el texto de una sección del temario en nodos React:
 * - bloques separados por líneas en blanco,
 * - `### ` -> h4, `- ` -> lista, `1. ` -> lista ordenada, resto -> párrafo,
 * - dentro de cada línea: **negrita**, *cursiva* y `[[ley | articulo]]` -> <CitaPill/>.
 */
export function renderTextoConCitas(texto: string): ReactNode[] {
  const out: ReactNode[] = [];
  let bi = 0;
  for (const bloque of texto.split(/\n\s*\n/)) {
    const lineas = bloque
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lineas.length === 0) continue;
    const key = `tb${bi++}`;
    const [primera] = lineas;
    if (lineas.length === 1 && primera.startsWith('### ')) {
      out.push(
        <h4 key={key} className="temario-h4">
          {parseInline(primera.slice(4).trim(), key)}
        </h4>,
      );
      continue;
    }
    if (lineas.every((l) => LIST_ITEM_RE.test(l))) {
      out.push(
        <ul key={key} className="temario-ul">
          {lineas.map((l, i) => (
            <li key={`${key}-li${i}`}>
              {parseInline(l.replace(LIST_ITEM_RE, ''), `${key}-li${i}`)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }
    if (lineas.every((l) => ORDERED_RE.test(l))) {
      out.push(
        <ol key={key} className="temario-ol">
          {lineas.map((l, i) => (
            <li key={`${key}-li${i}`}>
              {parseInline(l.replace(ORDERED_RE, ''), `${key}-li${i}`)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }
    out.push(
      <p key={key} className="temario-p">
        {parseInline(lineas.join(' '), key)}
      </p>,
    );
  }
  return out;
}

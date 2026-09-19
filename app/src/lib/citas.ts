// Parseo de citas de artículos ("art. 1.3", "arts. 68, 71 y 82"...).
// Debe mantenerse en sintonía con server/lib/articulos.js (parseCita).
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

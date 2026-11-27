import type { TemaDesarrollado } from '../types';

/**
 * Descarga del tema desarrollado en PDF (A4).
 *
 * El PDF se genera en el cliente con jsPDF a partir de los datos
 * estructurados del tema (no de la pantalla), así que sale limpio:
 * título, secciones, párrafos, listas y citas en texto plano
 * («Ley 18/2007 (art. 17)»). La fuente helvética estándar cubre
 * los caracteres españoles (tildes, ñ, ¿, ¡).
 *
 * jsPDF se importa de forma dinámica dentro de descargarPdfTema para
 * que el resto del módulo (nombre de archivo y conversión de texto)
 * no cargue la librería y se pueda probar sin ella.
 */

/** Slug para nombres de archivo: minúsculas, sin tildes, con guiones. */
export function slugify(texto: string): string {
  const base = texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base.slice(0, 60).replace(/-+$/g, '');
}

/** Nombre del archivo PDF, p. ej. `OposDipu-CSUR-PRO-T01-la-constitucion.pdf`. */
export function nombreArchivoPdf(tema: TemaDesarrollado): string {
  const slug = slugify(tema.titulo) || 'tema';
  return `OposDipu-${tema.id}-${slug}.pdf`;
}

const MARCADOR_CITA = /\[\[\s*([^\]|]+?)\s*\|\s*([^\]]+?)\s*\]\]/g;
const MARCADOR_SIN_BARRA = /\[\[\s*([^\]]+?)\s*\]\]/g;

// Abreviaturas habituales para las normas más citadas.
const ABREVIATURAS_LEY: Record<string, string> = {
  'Constitución Española de 1978': 'CE',
  'Tratado de la Unión Europea': 'TUE',
  'Tratado de Funcionamiento de la Unión Europea': 'TFUE',
  'Carta de los Derechos Fundamentales de la Unión Europea': 'CDFUE',
};

/**
 * Nombre corto de la norma para el PDF. Los títulos largos
 * («Ley 39/2015, de 1 de octubre, del Procedimiento…») se recortan
 * por la primera coma («Ley 39/2015»); sin coma se deja como está.
 * Repetir el título completo en cada cita (321 veces solo la Ley 39/2015)
 * haría el PDF ilegible.
 */
export function nombreCortoLey(ley: string): string {
  const abrev = ABREVIATURAS_LEY[ley];
  if (abrev) return abrev;
  const coma = ley.indexOf(',');
  return coma === -1 ? ley : ley.slice(0, coma).trim();
}

/**
 * Convierte el marcado en línea del temario a texto plano legible:
 * `[[Ley 18/2007 | art. 17]]` -> `Ley 18/2007 (art. 17)`,
 * `[[Constitución Española de 1978 | art. 1]]` -> `CE (art. 1)`,
 * `**negrita**` -> `negrita`, `*cursiva*` -> `cursiva`.
 * Un marcador mal formado se deja como texto sin corchetes.
 */
export function textoPlanoPdf(texto: string): string {
  return texto
    .replace(
      MARCADOR_CITA,
      (_m, ley: string, cita: string) =>
        `${nombreCortoLey(ley.trim())} (${cita.trim()})`,
    )
    .replace(MARCADOR_SIN_BARRA, (_m, inner: string) => inner.trim())
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*]+?)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- Bloques (misma gramática que lib/citas.tsx) ---------- */

type BloquePdf =
  | { tipo: 'h4'; texto: string }
  | { tipo: 'ul'; items: string[] }
  | { tipo: 'ol'; items: { n: string; texto: string }[] }
  | { tipo: 'p'; texto: string };

function bloquesPdf(texto: string): BloquePdf[] {
  const out: BloquePdf[] = [];
  for (const bloque of texto.split(/\n\s*\n/)) {
    const lineas = bloque
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lineas.length === 0) continue;
    const [primera] = lineas;
    if (lineas.length === 1 && primera.startsWith('### ')) {
      out.push({ tipo: 'h4', texto: textoPlanoPdf(primera.slice(4).trim()) });
      continue;
    }
    if (lineas.every((l) => l.startsWith('- '))) {
      out.push({
        tipo: 'ul',
        items: lineas.map((l) => textoPlanoPdf(l.slice(2).trim())),
      });
      continue;
    }
    if (lineas.every((l) => /^\d+\.\s+/.test(l))) {
      out.push({
        tipo: 'ol',
        items: lineas.map((l) => {
          const m = l.match(/^(\d+)\.\s+(.*)$/);
          return {
            n: m ? m[1] : '',
            texto: textoPlanoPdf(m ? m[2] : l),
          };
        }),
      });
      continue;
    }
    out.push({ tipo: 'p', texto: textoPlanoPdf(lineas.join(' ')) });
  }
  return out;
}

/* ---------- Generación del PDF ---------- */

const MARGEN_X = 20;
const ANCHO = 170; // A4 (210) menos 2 x 20 mm de margen
const Y_INICIAL = 20;
const Y_LIMITE = 277; // deja 20 mm abajo para el pie
const Y_PIE = 288;

/** Genera el PDF del tema y lanza su descarga en el navegador. */
export async function descargarPdfTema(
  opoTitulo: string,
  tema: TemaDesarrollado,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  let y = Y_INICIAL;

  const nuevaPagina = () => {
    doc.addPage();
    y = Y_INICIAL;
  };
  const cabeSiFalta = (alto: number) => {
    if (y + alto > Y_LIMITE) nuevaPagina();
  };

  // Cabecera de la primera página.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(79, 70, 229);
  doc.text('OPOSDIPU', MARGEN_X, y, { charSpace: 2 });
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(opoTitulo, MARGEN_X, y);
  y += 10;

  // Título del tema.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(32, 32, 58);
  const tituloLineas = doc.splitTextToSize(
    `Tema ${tema.numero}. ${tema.titulo}`,
    ANCHO,
  );
  for (const linea of tituloLineas) {
    cabeSiFalta(8);
    doc.text(linea, MARGEN_X, y);
    y += 8;
  }
  y += 2;
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.8);
  doc.line(MARGEN_X, y, MARGEN_X + ANCHO, y);
  y += 8;

  const escribirLineas = (
    lineas: string[],
    x: number,
    interlineado: number,
  ) => {
    for (const linea of lineas) {
      if (y + interlineado > Y_LIMITE) nuevaPagina();
      doc.text(linea, x, y);
      y += interlineado;
    }
  };

  for (const seccion of tema.secciones) {
    // Título de sección, con hueco para que no quede huérfano.
    cabeSiFalta(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(67, 56, 202);
    const tituloSec = doc.splitTextToSize(seccion.titulo, ANCHO);
    for (const linea of tituloSec) {
      doc.text(linea, MARGEN_X, y);
      y += 7;
    }
    y += 2;

    for (const bloque of bloquesPdf(seccion.texto)) {
      doc.setTextColor(32, 32, 58);
      if (bloque.tipo === 'h4') {
        cabeSiFalta(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11.5);
        const ls = doc.splitTextToSize(bloque.texto, ANCHO);
        for (const linea of ls) {
          if (y + 6 > Y_LIMITE) nuevaPagina();
          doc.text(linea, MARGEN_X, y);
          y += 6;
        }
        y += 2;
      } else if (bloque.tipo === 'ul') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        for (const item of bloque.items) {
          const ls = doc.splitTextToSize(item, ANCHO - 6);
          let primera = true;
          for (const linea of ls) {
            if (y + 6.2 > Y_LIMITE) nuevaPagina();
            if (primera) doc.text('•', MARGEN_X, y);
            doc.text(linea, MARGEN_X + 6, y);
            y += 6.2;
            primera = false;
          }
          y += 1;
        }
        y += 2;
      } else if (bloque.tipo === 'ol') {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        for (const item of bloque.items) {
          const ls = doc.splitTextToSize(item.texto, ANCHO - 8);
          let primera = true;
          for (const linea of ls) {
            if (y + 6.2 > Y_LIMITE) nuevaPagina();
            if (primera) doc.text(`${item.n}.`, MARGEN_X, y);
            doc.text(linea, MARGEN_X + 8, y);
            y += 6.2;
            primera = false;
          }
          y += 1;
        }
        y += 2;
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const ls = doc.splitTextToSize(bloque.texto, ANCHO);
        escribirLineas(ls, MARGEN_X, 6.2);
        y += 2.5;
      }
    }
    y += 4;
  }

  // Pie en todas las páginas, con numeración.
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`OposDipu · ${opoTitulo} · Tema ${tema.numero}`, MARGEN_X, Y_PIE);
    doc.text(`Página ${i} de ${total}`, MARGEN_X + ANCHO, Y_PIE, {
      align: 'right',
    });
  }

  doc.save(nombreArchivoPdf(tema));
}

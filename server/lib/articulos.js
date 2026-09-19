// Resolución de citas legales ("Ley X · art. 1.3") al texto del artículo
// usando el corpus empaquetado en server/corpus (Markdown de legalize-es).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CORPUS_DIR = join(here, "..", "corpus");

let mapa = null;
function loadMapa() {
  if (!mapa) {
    mapa = JSON.parse(readFileSync(join(CORPUS_DIR, "mapa.json"), "utf8"));
  }
  return mapa;
}

function norm(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ---- Resolución de la ley ----
// Devuelve { nombre, archivo, motivo? } o null si no se conoce la ley.
export function resolverLey(nombre) {
  const m = loadMapa();
  const hit = (k) => ({
    nombre: k,
    archivo: m[k].archivo,
    motivo: m[k].motivo,
  });
  if (Object.prototype.hasOwnProperty.call(m, nombre)) return hit(nombre);
  const n = norm(nombre);
  for (const k of Object.keys(m)) {
    if (norm(k) === n) return hit(k);
  }
  return null;
}

// ---- Parseo de la cita del artículo ----
// "art. 1.3" -> [{numero:1, sub:"3"}]
// "arts. 68, 71 y 82" -> [{numero:68},{numero:71},{numero:82}]
// "arts. 34-43" / "arts. 9 a 11" -> rango expandido
// "art. 4.1.a)" -> [{numero:4, sub:"1.a"}]
// Devuelve null si la cita no referencia artículos concretos.
const MAX_ARTICULOS = 40;

export function parseCita(cita) {
  if (!cita || typeof cita !== "string") return null;
  let s = cita.trim();
  const pref = s.match(/^arts?\.\s*(.+)$/i);
  if (!pref) return null;
  s = pref[1];

  const refs = [];
  const segmentos = s.split(";");
  for (let segRaw of segmentos) {
    let seg = segRaw.trim().replace(/^arts?\.\s*/i, "");
    seg = seg.replace(/\s+y\s+/gi, ",").replace(/\s+a\s+/gi, "-");
    for (const tokRaw of seg.split(",")) {
      const tok = tokRaw.replace(/\s+/g, "");
      if (!tok) continue;
      const rango = tok.match(/^(\d+)-(\d+)$/);
      if (rango) {
        const a = Number(rango[1]);
        const b = Number(rango[2]);
        if (b > a && b - a <= MAX_ARTICULOS) {
          for (let n = a; n <= b && refs.length < MAX_ARTICULOS; n++) {
            refs.push({ numero: n, sub: "" });
          }
        } else if (a) {
          refs.push({ numero: a, sub: "" });
        }
        continue;
      }
      const num = tok.match(/^(\d+)(.*)$/);
      if (num) {
        const sub = num[2].replace(/^[.\s]+|[)\s.]+$/g, "");
        refs.push({ numero: Number(num[1]), sub });
      }
    }
  }
  if (refs.length === 0) return null;
  // dedup por numero, ordenados
  const vistos = new Set();
  const out = [];
  for (const r of refs.sort((x, y) => x.numero - y.numero)) {
    if (!vistos.has(r.numero)) {
      vistos.add(r.numero);
      out.push(r);
    }
  }
  return out.slice(0, MAX_ARTICULOS);
}

// ---- Extracción de artículos del Markdown ----
const docsCache = new Map(); // archivo -> { titulo, articulos: Map(clave -> {numero, titulo, texto}) }

function claveArticulo(num) {
  return String(num).toLowerCase().replace(/[.\s]+$/, "");
}

function parseDoc(archivo) {
  if (docsCache.has(archivo)) return docsCache.get(archivo);
  const raw = readFileSync(join(CORPUS_DIR, archivo), "utf8");
  // título del frontmatter YAML
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n/);
  let titulo = archivo;
  if (fm) {
    const t = fm[1].match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (t) titulo = t[1];
  }
  const body = fm ? raw.slice(fm[0].length) : raw;

  // todas las cabeceras, para cortar el texto de cada artículo en la siguiente
  const heads = [];
  const reHead = /^#{1,6}\s+(.+?)\s*$/gm;
  let mh;
  while ((mh = reHead.exec(body)) !== null) {
    heads.push({ texto: mh[1], inicio: mh.index, fin: mh.index + mh[0].length });
  }
  const articulos = new Map();
  const reArt = /^artículo\s+(.+)$/i;
  for (let i = 0; i < heads.length; i++) {
    const ma = heads[i].texto.match(reArt);
    if (!ma) continue;
    const resto = ma[1].trim();
    const mn = resto.match(/^(\d+)(\s+[a-záéíóúñ]+)?/i);
    if (!mn) continue;
    const numero = Number(mn[1]);
    const sufijo = (mn[2] || "").trim();
    const clave = claveArticulo(sufijo ? `${numero} ${sufijo}` : `${numero}`);
    // título del artículo: lo que sigue al número en la cabecera ("1. Objeto." -> "Objeto.")
    let tituloArt = resto
      .slice(mn[0].length)
      .replace(/^[.\s:–-]+/, "")
      .trim();
    const siguiente = i + 1 < heads.length ? heads[i + 1].inicio : body.length;
    let texto = body.slice(heads[i].fin, siguiente).trim();
    // por si acaso: recorta restos de cabeceras pegadas
    texto = texto.replace(/^#{1,6}\s+.*$/gm, "").trim();
    if (!articulos.has(clave)) {
      articulos.set(clave, { numero, titulo: tituloArt, texto });
    }
  }
  const doc = { titulo, articulos };
  docsCache.set(archivo, doc);
  return doc;
}

export function tituloDocumento(archivo) {
  return parseDoc(archivo).titulo;
}

export function extraerArticulo(archivo, numero) {
  const doc = parseDoc(archivo);
  return doc.articulos.get(claveArticulo(numero)) || null;
}

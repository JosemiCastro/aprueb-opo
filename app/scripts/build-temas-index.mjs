// build-temas-index.mjs
// Parsea doc/app/temario-a2-c1.md y genera src/data/temas.json
// Uso: node scripts/build-temas-index.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, '..');
const mdPath = join(appRoot, '..', 'doc', 'app', 'temario-a2-c1.md');
const outPath = join(appRoot, 'src', 'data', 'temas.json');

const text = readFileSync(mdPath, 'utf8');

const temas = [];
let perfil = null; // 'a2' | 'c1'
let tipo = null;   // 'comun' | 'especifico'

for (const raw of text.split('\n')) {
  const line = raw.trim();
  const proc = line.match(/^## PROCESO (\d+)/);
  if (proc) {
    perfil = proc[1] === '29' ? 'a2' : proc[1] === '33' ? 'c1' : null;
    tipo = null;
    continue;
  }
  if (/^\*\*TEMAS COMUNES\*\*/.test(line)) { tipo = 'comun'; continue; }
  if (/^\*\*TEMAS ESPEC[IÍ]FICOS\*\*/.test(line)) { tipo = 'especifico'; continue; }
  if (/^#{1,6}\s/.test(line)) { tipo = null; continue; }
  if (!perfil || !tipo) continue;
  const m = line.match(/^(\d{1,2})\.\s+(.+)$/);
  if (m) {
    const numero = String(m[1]);
    const nn = numero.padStart(2, '0');
    temas.push({
      id: (tipo === 'comun' ? 'T' : 'E') + nn,
      perfil,
      tipo,
      numero,
      titulo: m[2].trim(),
    });
  }
}

// Verificación de totales esperados
const count = (p, t) => temas.filter((x) => x.perfil === p && x.tipo === t).length;
const expected = { a2: { comun: 12, especifico: 48 }, c1: { comun: 8, especifico: 32 } };
let ok = true;
for (const p of ['a2', 'c1']) {
  for (const t of ['comun', 'especifico']) {
    const got = count(p, t);
    const want = expected[p][t];
    if (got !== want) { ok = false; console.error(`✗ ${p}/${t}: ${got} (esperados ${want})`); }
    else console.log(`✓ ${p}/${t}: ${got}`);
  }
}
if (!ok) { console.error('Totales no coinciden — no se genera el fichero.'); process.exit(1); }

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(temas, null, 2) + '\n', 'utf8');
console.log(`Generado ${outPath} con ${temas.length} temas.`);

// Copia server/corpus/mapa.json a app/src/data/mapa.json
// para que el build del frontend (Docker) no dependa de ficheros fuera de app/.
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dest = join(root, 'app', 'src', 'data');
mkdirSync(dest, { recursive: true });
copyFileSync(join(root, 'server', 'corpus', 'mapa.json'), join(dest, 'mapa.json'));
console.log('mapa.json sincronizado en app/src/data/');

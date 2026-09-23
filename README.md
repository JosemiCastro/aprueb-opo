# OposDipu — Diputación de Huelva

App de estudio para las oposiciones de la **Diputación Provincial de Huelva**
(TANDA V, BOP Huelva nº 138 de 20/07/2026, Resolución 2431/2026):

- **C1 Administrativo/a de Administración General** (proceso 33, 7 plazas): banco de **800 preguntas cortas** con respuesta, explicación y cita legal (20 por tema × 40 temas).
- **A2 Técnico/a Medio/a de Gestión** (proceso 29, 2 plazas): **60 fichas-esquema** con puntos clave citados y checklist de autoevaluación.

## La app (`app/`)

PWA instalable y 100 % offline (React 19 + Vite + TypeScript):

- Selector de perfil C1/A2, estudio por tema, test con nota sobre 10, repaso de falladas.
- Panel de progreso: % por tema y global, racha de días, historial (localStorage).

```bash
cd app
npm install
npm run dev     # desarrollo → http://localhost:5173
npm run build   # producción → dist/
npm test        # vitest
```

## Contenidos (`data/`)

- `data/c1/preguntas/HUE-C1-{T|E}{nn}.json` — preguntas C1.
- `data/a2/esquemas/HUE-A2-{T|E}{nn}.json` — fichas A2.

Esquema documentado en `doc/app/app_spec.md`. Calidad: las citas legales
fueron auditadas contra el texto consolidado del BOE (`doc/quality/informe-auditoria.md`).

## Documentación (`doc/`)

- `doc/app/app_prd.md` — PRD, `doc/app/app_spec.md` — especificación técnica,
  `doc/app/temario-*.md` — temarios oficiales, `doc/app/plan_trabajo.md` — plan.
- `doc/fuentes/TANDA-V.pdf` — bases oficiales de la convocatoria.

## Backend (`server/`)

API de autenticación (Node 20 + Express + JWT) y servidor de los estáticos
de la app. Endpoints:

- `POST /api/auth/register` `{username, password}` → 201 / 400 / 409
- `POST /api/auth/login` `{username, password}` → 200 `{token}` / 401
- `GET /api/auth/me` (header `Authorization: Bearer <token>`) → 200 `{username}` / 401
- `GET /api/articulo?ley=<nombre citado>&articulo=<cita>` → 200 / 400 / 404.
  Devuelve el texto de los artículos del corpus legal local
  (`server/corpus/`, extraído de legalize-es según `doc/quality/mapa-leyes.json`).
  Respuesta: `{ley, cita, titulo, articulos: [{numero, sub, titulo, texto}], noEncontrados}`.
  404 si la ley no está en el corpus (p. ej. normativa propia de Diputación)
  o si el artículo no se encuentra.

Los usuarios se guardan en `users.json` dentro de `DATA_DIR` (escritura atómica,
passwords con bcrypt 10 rounds). El token JWT expira a los 7 días.

```bash
cd server
npm install
npm start   # http://localhost:3000
npm test    # tests con node:test (15 casos)
```

### Variables de entorno

| Variable     | Defecto                  | Descripción                                                                |
|--------------|--------------------------|----------------------------------------------------------------------------|
| `JWT_SECRET` | *(ninguno)*               | **Obligatorio: el servidor no arranca sin él.** Secreto para firmar JWT     |
| `PORT`       | `3000`                   | Puerto de escucha                                                          |
| `SEED_USER`  | `admin`                  | Usuario creado al arrancar (si no existe)                                  |
| `SEED_PASS`  | `oposdipu-2026`          | Contraseña del usuario seed                                                |
| `DATA_DIR`   | `<server>/data`          | Directorio donde se guarda `users.json`                                    |

Seguridad: el login está limitado a 10 intentos por IP cada 15 minutos y el
registro a 5 por IP cada hora. Para desarrollo local arranca con
`JWT_SECRET=dev-local-... npm start` (cualquier cadena sirve en local).

Credenciales por defecto: **admin / oposdipu-2026** (solo desarrollo).
En producción define `SEED_USER`/`SEED_PASS` propios o desactiva el seed con
`NO_SEED=1` después de crear tu usuario.

### Despliegue en Easypanel

1. Conecta el repo de GitHub y elige **deploy con Dockerfile** (el de la raíz
   construye el frontend con Vite y lo sirve junto a la API con un solo
   proceso Node).
2. Define `JWT_SECRET` como **secreto** (cadena larga aleatoria).
3. Monta un **volumen persistente** en la ruta de `DATA_DIR`
   (p. ej. `/srv/server/data`, que es el valor por defecto dentro del
   contenedor) para no perder los usuarios entre despliegues.
4. (Opcional) Define `SEED_USER`/`SEED_PASS` o `NO_SEED=1` según prefieras.

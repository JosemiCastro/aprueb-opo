# OposDipu

App de estudio para las oposiciones de las **diputaciones andaluzas**.
PWA instalable y 100 % offline (React 19 + Vite + TypeScript), con backend
propio de autenticación (Node 20 + Express + JWT).

## Oposiciones incluidas

| Diputación | Cuerpo | Grupo | Plazas | Contenido |
|---|---|---|---|---|
| Huelva | Administrativo/a (TANDA V, BOP Huelva nº 138 de 20/07/2026) | C1 | 7 | 40 temas · **800 preguntas** |
| Huelva | Técnico/a Medio/a de Gestión (TANDA V, proceso 29) | A2 | 2 | **60 fichas-esquema** |
| Cádiz | Auxiliar Administrativo/a (BOP Cádiz nº 28 de 11/02/2026) | C2 | 44 | 24 temas · **398 preguntas** |
| Granada | Agente de Gestión Tributaria | C1 | 13 | 30 temas · **300 preguntas** |
| Sevilla (OPAEF) | Técnico/a de Administración General | A1 | 2 | 38 temas · **304 preguntas** |

**1.802 preguntas de test** en total. Las preguntas del C1 de Huelva llevan
respuesta, explicación y cita legal; el programa de Cádiz es el oficial del
BOP. Los programas de Granada y Sevilla son de referencia (anexo oficial
de 2026 pendiente de publicación).

## Funcionalidades

- Estudio por tema y tests con nota sobre 10.
- Tests por ámbitos: todas, pendientes y falladas, con repaso de falladas.
- Temario desarrollado con los **artículos de las leyes enlazados**
  (texto del corpus legal local servido por la API).
- Panel de progreso: % por tema y global, racha de días e historial.
- Selector de perfil por oposición y menú responsive en móvil.

## La app (`app/`)

```bash
cd app
npm install
npm run dev     # desarrollo → http://localhost:5173
npm run build   # producción → dist/
npm test        # vitest (44 tests)
```

## Contenidos (`app/src/data/`)

- `oposiciones.json` — catálogo de oposiciones (plazas, bases, estado).
- `c1/`, `cad-c2/`, `gra-c1/`, `sev-a1/` — preguntas por tema (`*-E*.json`)
  y temario (`*-T*.json`, `_temas.json`).
- `a2/` — fichas-esquema del A2 de Huelva.
- `temas.json`, `mapa.json` — índices de temas y del corpus legal.

## Backend (`server/`)

API de autenticación y servidor de los estáticos de la app. Endpoints:

- `POST /api/auth/register` `{username, password}` → **201 `{username, token}`**
  (crea la cuenta y deja la sesión iniciada) / 400 / 409
- `POST /api/auth/login` `{username, password}` → 200 `{token}` / 401
- `GET /api/auth/me` (header `Authorization: Bearer <token>`) → 200 `{username}` / 401
- `GET /api/articulo?ley=<nombre citado>&articulo=<cita>` → 200 / 400 / 404.
  Devuelve el texto de los artículos del corpus legal local
  (`server/corpus/`). Respuesta:
  `{ley, cita, titulo, articulos: [{numero, sub, titulo, texto}], noEncontrados}`.
  404 si la ley no está en el corpus (p. ej. normativa propia de Diputación)
  o si el artículo no se encuentra.

Los usuarios se guardan en `users.json` dentro de `DATA_DIR` (escritura
atómica, passwords con bcrypt 10 rounds). El token JWT expira a los 7 días.

```bash
cd server
npm install
npm start   # http://localhost:3000
npm test    # tests con node:test (17 casos)
```

### Variables de entorno

| Variable     | Defecto         | Descripción                                                            |
|--------------|-----------------|------------------------------------------------------------------------|
| `JWT_SECRET` | *(ninguno)*     | **Obligatorio: el servidor no arranca sin él.** Secreto para firmar JWT |
| `PORT`       | `3000`          | Puerto de escucha                                                      |
| `SEED_USER`  | `admin`         | Usuario creado al arrancar (si no existe)                              |
| `SEED_PASS`  | `oposdipu-2026` | Contraseña del usuario seed                                            |
| `DATA_DIR`   | `<server>/data` | Directorio donde se guarda `users.json`                                |

Credenciales por defecto: **admin / oposdipu-2026** (solo desarrollo).
En producción define `SEED_USER`/`SEED_PASS` propios o desactiva el seed con
`NO_SEED=1` después de crear tu usuario. Para desarrollo local arranca con
`JWT_SECRET=dev-local-... npm start` (cualquier cadena sirve en local).

### Seguridad

- **Rate limiting**: login limitado a 10 intentos por IP cada 15 minutos y
  registro a 5 por IP cada hora (`trust proxy` activado para ver la IP real
  tras el proxy inverso).
- **Sin `JWT_SECRET` el servidor no arranca**: no hay secreto de respaldo.
- `JWT_SECRET` debe pasarse como **secreto/variable de entorno en runtime**,
  nunca como argumento de build (quedaría en los logs).
- Rota el `JWT_SECRET` si alguna vez queda expuesto: todos los tokens
  firmados con el anterior quedan invalidados.

### Despliegue en Easypanel

1. Conecta el repo de GitHub y elige **deploy con Dockerfile** (el de la raíz
   construye el frontend con Vite y lo sirve junto a la API con un solo
   proceso Node).
2. Define `JWT_SECRET` como **secreto** (cadena larga aleatoria).
3. Monta un **volumen persistente** en la ruta de `DATA_DIR`
   (p. ej. `/srv/server/data`, que es el valor por defecto dentro del
   contenedor) para no perder los usuarios entre despliegues.
4. (Opcional) Define `SEED_USER`/`SEED_PASS` o `NO_SEED=1` según prefieras.
5. Tras cada cambio, redespliega para que entre en vigor.

## Documentación (`doc/`)

- `doc/app/` — `app_prd.md` (PRD), `app_spec.md` (especificación técnica),
  `plan_trabajo.md`, `temario.md`, `temario-a2-c1.md` (temarios).
- `doc/fuentes/` — `TANDA-V.pdf` (bases oficiales de Huelva), `legalize-es/`
  (fuentes del corpus legal).
- `doc/quality/` — `informe-auditoria.md` (auditoría de citas legales contra
  el texto consolidado del BOE), `mapa-leyes.json`, `indice-corpus.json`.

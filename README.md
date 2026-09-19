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

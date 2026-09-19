# Plan de trabajo — OposDipu (metodología specbox)

**Fecha:** 2026-09-19 · **Tracking:** FreeForm (`doc/tracking/`) · **Estado:** Fase 5 completa (auditoría UC-010, 2026-09-19). ✅
- Corpus legalize-es clonado y verificado (HEAD b2f44c4, 12.285 normas); mapa ley→fichero en `doc/quality/mapa-leyes.json`.
- **UC-010** Auditoría: 218/1414 ítems verificados contra el BOE (100 C1 + 118 puntos A2), **60 correcciones aplicadas** (0 artículos inventados tras corrección). Informe: `doc/quality/informe-auditoria.md`.
- Pendientes documentados: normativa propia de la Diputación (contraste con BOP oficial), casos legítimos con "—", RGPD y jurisprudencia.
**Alcance:** Diputación de Huelva — A2 Técnico Medio de Gestión (proceso 29) y C1 Administrativo (proceso 33). Fuente: TANDA V, BOP Huelva nº 138 (20/07/2026).

Flujo: fuentes → especificación → contenidos → app v1 → simulacros → quality gate.

---

## Fase 0 — Fuentes y corpus legal

- **US-00.** Fuentes oficiales cerradas antes de generar contenido.
  - **UC-001** Archivar el PDF oficial de la TANDA V.
    - AC-01: PDF descargado en `doc/fuentes/TANDA-V.pdf`. ✅ (2026-09-19)
  - **UC-002** Clonar el corpus legal (`legalize-es`) como referencia para redactar.
    - AC-01: repo clonado en `doc/fuentes/legalize-es` (en curso, clonación en marcha).
    - AC-02: localizadas en el corpus las leyes del temario (CE, 39/2015, 40/2015, 7/1985, RDL 2/2004, 9/2017, TREBEP, etc.).
  - **UC-003** Localizar el Reglamento de Organización y Funcionamiento de la Diputación de Huelva (BOP nº 136, 18/07/2016) — temas de corporación provincial (A2-T47, C1-T31).
    - AC-01: documento archivado en `doc/fuentes/`.

## Fase 1 — Especificación (hecha)

- **US-01.** PRD v2 y spec v2 con los dos perfiles y sus formatos de examen. ✅

## Fase 2 — Contenidos

**Oleada 1 (piloto) completada 2026-09-19:** 160 preguntas C1 (temas comunes 1–8, 20 por tema) en `data/c1/preguntas/` + 3 fichas-esquema A2 (temas comunes 1–3) en `data/a2/esquemas/`. TODO marcado `verificado_corpus: false` (el corpus legalize-es aún se estaba clonando durante la generación) → pendiente de re-verificación contra el corpus en la Fase 5 (UC-010). 1 duplicado detectado y corregido (T05-008). Normalización de nombres de leyes pendiente de decisión. Oleada 2 en espera de revisión.

- **US-02.** Banco C1: 20 preguntas cortas por tema × 40 temas = 800 preguntas. ✅ COMPLETA (800/800, IDs únicos, validado 2026-09-19)
  - Oleada 1 (piloto): 8 temas comunes → 160 preguntas ✅ validadas 2026-09-19.
  - Oleada 2a (banco C1, temas específicos E01–E32): 32 ficheros × 20 preguntas = 640 ✅ completada 2026-09-19. TODO `verificado_corpus: false` (corpus aún clonándose) → re-verificación en Fase 5 (UC-010). Nombres de ley normalizados en oleadas 1+2a ("RDL 5/2015 (TREBEP)" → "Real Decreto Legislativo 5/2015", 19 preguntas en T08).
  - **UC-004** Generar preguntas ancladas a artículos concretos.
    - AC-01: cada pregunta tiene `ley` + `articulo` + `explicacion` que cita el precepto.
    - AC-02: quality gate — 0 preguntas sin fuente verificable; las dudosas van a revisión, no al banco.
- **US-03.** Fichas A2: 1 esquema por tema × 60 temas, con puntos clave citados y checklist de autoevaluación. ✅ COMPLETA (60/60, 614 puntos clave, validado 2026-09-19)
  - Oleada 1 (piloto): 3 fichas (T01–T03) ✅ validadas 2026-09-19.
  - Oleada 2b: 57 fichas restantes ✅ completada 2026-09-19 (60/60 fichas totales en `data/a2/esquemas/`, 614 puntos clave, 290 checks; TODO `verificado_corpus: false` — el clon del corpus legalize-es se eliminó por corrupto, pendiente de re-clonación y re-verificación en Fase 5/UC-010). Nombres de ley normalizados (126 referencias: títulos completos de RD/RDL/Decretos añadidos).
  - **UC-005** Generar esquemas verificables.
    - AC-01: cada punto clave cita `ley` + `articulo`.
    - AC-02: la checklist permite al opositor decidir si domina el tema para desarrollarlo en 2h.

## Fase 3 — App v1 ✅ COMPLETA (2026-09-19)

App PWA en `~/workspace/opos-dipu/app` (Vite + React 19 + TS). `npm run build` ✅, `npm test` ✅ (13/13).

- **US-04.** Estudiar C1 por tema: flashcard pregunta → ver respuesta → acierto/fallo, con explicación + ley/artículo. ✅
- **US-05.** Test C1 configurable (N preguntas, ámbitos: todos/pendientes/falladas) con nota sobre 10, APTO/NO APTO y desglose por tema. ✅
- **US-06.** Repaso de falladas (C1): preguntas con ko>0 no dominadas, vuelven hasta dominarlas. ✅
- **US-07.** Fichas A2: 60 temas con puntos clave (ley/artículo) + checklist de autoevaluación; badge "dominado" al completar. ✅
- **US-08.** Progreso: % por tema y global C1, % medio y temas dominados A2, racha de días, historial de sesiones. Persistencia en localStorage (`oposdipu-progress-v1`). ✅
- **US-09.** PWA instalable y offline: manifest + service worker (workbox, precache 1202 KiB), iconos 192/512, autoUpdate. ✅

## Fase 4 — Simulacros (v2)

- **US-10.** Simulacro C1: 40 preguntas, 2h, nota mínima 5 (formato del examen real).
- **US-11.** Simulacro A2: desarrollo cronometrado de tema al azar (3 del específico / 2 del común) + supuesto práctico.

## Fase 5 — Quality gate final

- **UC-010** Auditoría: muestra aleatoria del banco y las fichas re-verificada contra el corpus legal (las bases exigen actualización normativa como criterio de corrección).
  - AC-01: informe en `doc/quality/`.

## Fase 6 — Publicar en GitHub

- **US-12.** Subir el proyecto al repo `JosemiCastro/aprueb-opo`. ✅ PUBLICADO 2026-09-19 (rama main, 249 archivos).
  - AC-01: `main` contiene `doc/`, `data/` y README con descripción del proyecto.
  - Pendiente: acceso push (token de Josemi con permiso `contents:write` en el repo) cuando termine la generación de contenidos.

---

## Decisiones tomadas (defaults, se pueden cambiar)

- Stack: React 19 + Vite PWA, datos en JSON local, sin backend en v1.
- Tracking specbox: FreeForm local.
- Sevilla y C2 aparcados hasta nuevo aviso.

## Preguntas abiertas para Josemi

1. ¿Tu categoría es A2, C1 o las dos? (define por dónde empezamos a generar contenido)
2. ¿20 preguntas por tema en C1 te vale para v1, o priorizamos cantidad en algún bloque (p. ej. Ley 39/2015)?

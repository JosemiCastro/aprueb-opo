# App Spec — OposDipu

**Última actualización:** 2026-09-19
**Versión:** 2 (perfiles A2 y C1 de Huelva)

---

## 1. Stack (propuesto, pendiente de confirmación)

| Capa | Tecnología | Notas |
|------|------------|-------|
| App | React 19 + Vite | PWA instalable, funciona offline |
| Datos | JSON local (`data/c1/preguntas/*.json`, `data/a2/esquemas/*.json`) | Un fichero por tema; versionado en git |
| Progreso | localStorage / IndexedDB | Sin backend en v1 |
| Tests | Vitest | Lógica de progreso y corrección |
| Tracking specbox | FreeForm | `doc/tracking/` local |

## 2. Modelo de datos (borrador)

**Pregunta (C1)**
```json
{
  "id": "HUE-C1-T05-001",
  "perfil": ["c1"],
  "tema": 5,
  "ley": "Ley 39/2015",
  "articulo": "art. 21",
  "enunciado": "...",
  "opciones": ["...", "...", "...", "..."],
  "respuesta": 1,
  "explicacion": "..."
}
```

**Esquema de tema (A2)**
```json
{
  "id": "HUE-A2-T03",
  "perfil": ["a2"],
  "tema": 3,
  "titulo": "...",
  "puntos_clave": [
    { "punto": "...", "ley": "Ley 39/2015", "articulo": "art. 21" }
  ],
  "checklist": ["Puedo definir...", "Puedo citar los plazos de..."]
}
```

**Progreso** (por dispositivo): `{ item_id, aciertos, fallos, ultima_vez, dominado: bool }`

## 3. Convenciones del proyecto

- **Naming:** US-XX (historias), UC-XXX (casos de uso), AC-XX (criterios de aceptación)
- **IDs:** `HUE-{A2|C1}-{T|E}{tema}-{nnn}` (T = tema común, E = tema específico; p. ej. `HUE-C1-E05-012`)
- **Quality gate:** ningún contenido entra sin `ley` + `articulo` verificables contra el corpus legal
- **Corpus legal:** https://github.com/legalize-dev/legalize-es (estatal + autonómica consolidada desde el BOE) + normativa propia de la Diputación de Huelva por separado
- **Fuente oficial de temarios:** TANDA V, Resolución 2431/2026 — BOP Huelva nº 138 (20/07/2026). Detalle íntegro en `doc/app/temario-a2-c1.md`

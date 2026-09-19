# Informe de auditoría UC-010 — Verificación de citas legales contra el corpus

**Fecha:** 2026-09-19
**Corpus:** `legalize-es` (commit `b2f44c4`), 12.285 normas indexadas. Mapa ley→fichero: `doc/quality/mapa-leyes.json` (55/67 leyes del banco localizadas; 12 sin corpus por motivo documentado).
**Alcance:** lista priorizada completa (`doc/quality/notas-reverificacion.md`) + muestra aleatoria del 10 % del resto.

## Totales

| Bloque | Verificados `true` | Correcciones aplicadas |
|---|---|---|
| C1 comunes T01–T08 (160 preg.) | 15 | 3 |
| C1 específicos E01–E16 (320 preg.) | 51 | 14 |
| C1 específicos E17–E32 (320 preg.) | 34 | 10 |
| A2 fichas (614 puntos clave) | 118 | 33 |
| **TOTAL** | **218 / 1414 (15,4 %)** | **60 ítems** |

Criterio aplicado: ningún número de artículo inventado. Todo lo corregido usa texto confirmado en el corpus; lo no confirmable quedó en `false` con motivo.

## Correcciones aplicadas — C1

**Comunes:**
- `HUE-C1-T06-001` — `articulo`/`explicacion`: "arts. 54 a 96" → **"arts. 53 a 105"** (Título IV Ley 39/2015).
- `HUE-C1-T07-001` — `respuesta`/`explicacion`: eliminado el requisito "y se personen en el procedimiento" (el art. 4.1.b LPAC no lo exige).
- `HUE-C1-T07-011` — `respuesta`: "con las prestaciones personales y de servicios que se establezcan" → **"mediante las prestaciones económicas y personales legalmente previstas…"** (art. 18.1.d LRBRL).

**E01–E16:**
- `HUE-C1-E02-009` — `articulo` art. 14 → **art. 12** (+ enunciado y explicación: "asistencia técnica", art. 12.1.f LAULA).
- `HUE-C1-E07-004` — art. 18 → **art. 16.3.c)** (promoción interna vertical).
- `HUE-C1-E07-005` — art. 19 → **art. 16.3.d)** (promoción interna horizontal).
- `HUE-C1-E07-011` — art. 4 → **art. 3.1** (condiciones de autorización).
- `HUE-C1-E07-013` — explicación: art. 12.1.a) → **art. 12.1.c)**.
- `HUE-C1-E07-014` — reescritas con la redacción vigente del art. 16.1 (factor de incompatibilidad) + excepción art. 16.4 (límite 30 %).
- `HUE-C1-E07-015` — art. 19 → **art. 9** (atribución al Pleno).
- `HUE-C1-E07-016` — `ley` → RDL 5/2015, `articulo` art. 20 → **art. 95.2.n)** (falta muy grave).
- `HUE-C1-E01-011` — eliminado contenido derogado (antiguo art. 26.4); reducido a coordinación art. 26.2.
- `HUE-C1-E03-001` — `articulo`: art. 78 → **"arts. 78 y 79"** (extraordinarias urgentes = art. 79).
- `HUE-C1-E03-011` — `articulo`: art. 98 → **art. 101** (votaciones).
- `HUE-C1-E13-001` — `articulo`: "art. 8" → **art. 70.1** (expediente administrativo; errata).
- `HUE-C1-E13-011` — `articulo`: art. 18 → **art. 47.1** RD 203/2021 (copia auténtica).
- `HUE-C1-E16-001` — `articulo`: art. 70 → **"Título IV"** (fases del procedimiento).

**E17–E32:**
- `HUE-C1-E17-012` — `explicacion`: "art. 124.3 (en relación con 124.2)" → **"art. 124.2 (en relación con 123.2)"**.
- `HUE-C1-E26-010` — `articulo`/`respuesta`/`explicacion`: art. 36 → **art. 57** (interés legal de demora del justiprecio).
- `HUE-C1-E26-011` — `articulo`/`explicacion`: art. 37 → **art. 47** (premio de afección del 5 %; el 37 trata de tasaciones). *Cita errónea grave.*
- `HUE-C1-E26-012` — `articulo`/`explicacion`: art. 34 → **art. 48** (pago en 6 meses).
- `HUE-C1-E26-014` — `articulo`/`explicacion`: art. 53 → **art. 52** (acta previa a la ocupación).
- `HUE-C1-E26-015` — `articulo`/`explicacion`: art. 48 → **art. 108** (ocupaciones temporales).
- `HUE-C1-E27-001` — `respuesta`/`explicacion` reescritas fieles al art. 1 Ley 40/2015 (antes mezclaba el objeto de la Ley 39/2015).
- `HUE-C1-E28-011` — `respuesta`/`explicacion`: causas de resolución del art. 51.2 Ley 40/2015 (se eliminó "la denuncia", que no figura, y se añadió el transcurso del plazo sin prórroga).
- `HUE-C1-E29-011` — `explicacion`: art. 3.1.h) → **art. 3.1.g)**.
- `HUE-C1-E30-020` — `articulo`/`explicacion`: art. 39 → **art. 40** (la Autoridad Independiente se crea en el 40; el 39 es diálogo con ONG).

Verificadas OK sin cambios (muestra): E17-006, E17-011 (plazos alzada/reposición), E20-019 (umbral 50.000 € del dictamen, art. 81.2 confirmado), E30-019 (art. 4 Ley 15/2022), y el resto de la muestra de los tres bloques.

## Correcciones aplicadas — A2 (33 puntos, 50 ediciones)

- `E07[6]` art. 84 → **art. 87** · `E10[4]` arts. 62–67 → **arts. 62–68** · `E10[5]` "el Secretario judicial" → **"el Juez o Tribunal, por auto"** (art. 76.2)
- `E12[3]` arts. 85.2.A).4.º y 85 ter → **arts. 85.2.A).d) y 85 ter LBRL + art. 46.4 LAULA** ("potestades públicas")
- `E14[6]` arts. 65–69 → **arts. 65–72** · `E14[9]` arts. 84–93 → **arts. 84–93 y 104** (eliminado "uso anormal"/"reversión de obras", sin apoyo)
- `E15[0]` art. 5 → **art. 7** · `E15[1]` art. 7 → **art. 8** · `E15[7]` reescrito con art. 112.2 (diferencia ≤ 40 %)
- `E19[5]` arts. 13 y 13.2 → **arts. 11.2, 13 y 13.2** · `E21[8]` arts. 205–207 → **arts. 204–206** (D'Hondt = 204.2/205.3) · `E21[9]` art. 208 → **art. 207**
- `E22[9]` art. 182 → **arts. 182 y 208** · `E26[8]` arts. 10 y 11 → **art. 11** · `E27[10]` reescrito (jubilación parcial: % sin relevo)
- `E28[6]` arts. 4 y 10 → **arts. 3, 4 y 10** · `E29[5]` "hasta un año" → **"hasta tres años"**; reserva "primer año" → **"dos primeros años"**
- `T07[7]` reescrito (cesión de impuestos art. 112 + Fondo Complementario 118–119; modelo 122–124) · `T09[2]` arts. 44–45 → **art. 42.2** · `T09[8]` art. 1 → **arts. 1 y 2**
- `T10[3]` art. 80 → **arts. 80 y 82** · `T10[11]` art. 206 → **arts. 204–206** · `T10[0]` art. 46.1 → **art. 46.1 LBRL + art. 85.1 ROF**
- `E04[10]` arts. 100–104 → **arts. 100–105** · `E06[0]` art. 54 → **art. 55** · `E16[0]` art. 9.2 → **arts. 9.2 y 9.3**
- `E20[0]` art. 1 → **art. 11.1** · `E22[0]` "cinco días" → **"décimo día hábil"** · `E28[0]` eliminado "y negociación colectiva"
- `E32[0]` art. 28 → **arts. 28 y 99.2** · `E43[0]` art. 3 → **arts. 3 y 11.3** · `T08[0]` art. 19.1 → **art. 20.1** · `T11[10]` art. 218 → **arts. 215 y 216**

## Pendientes no verificables por corpus (`verificado_corpus: false`)

- **Normativa propia de la Diputación de Huelva** (no está en el corpus; pendiente de contraste con el BOP oficial): C1 `E10-011`, `E31-001`, `E31-011`; A2 `E30[5,6,9]`, `E47[7,8]`.
- **Casos legítimos sin precepto citable** (`articulo: "—"`): C1 `T01-001`–`T01-004` (fechas/antecedentes CE), `E18-*`/`E19-*` (LibreOffice, 40), `E10` concertación (9), `E11` tasa de residuos (1).
- **Fuera del ámbito del corpus**: C1 `E25-001` (Reglamento UE 2016/679); A2 `T06[4]` (STC 32/1981, jurisprudencia).
- **Resto no muestreado**: 700 preguntas C1 y 496 puntos A2 quedan en `false` por defecto (fuera del alcance P1 + 10 %).

## Hallazgos sistémicos

1. La LEF 1954 numera sus artículos con ordinales en letra ("cuarenta y ocho"), lo que provocó citas desplazadas en el bloque E26 (4 correcciones).
2. Varias citas usaban la numeración de la derogada Ley 30/1992 en lugar de la Ley 39/2015 (E04[10] A2, E01-011 C1).
3. El bloque E07 (C1) y los temas de personal/LOREG (A2) concentraron más errores: son los temas a repasar si se amplía la muestra.

## Conclusión

La auditoría cubrió el 100 % de las citas marcadas como dudosas y una muestra del 10 % del resto: **218 ítems verificados contra el texto consolidado del BOE, 60 corregidos** (ningún artículo inventado tras la corrección) y el resto pendiente documentado con su motivo. El banco es fiable en lo verificado; para una garantía total habría que extender la muestra, priorizando personal/LOREG y LEF.

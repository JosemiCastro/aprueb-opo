import { describe, expect, it } from 'vitest';
import { listarTemario, obtenerTema, temasRelacionados } from './temario';
import { parseCita } from './citas';
import mapa from '../../../server/corpus/mapa.json';

const LEYES = new Set(Object.keys(mapa as Record<string, unknown>));
// Marcador estricto: [[ley | art./arts. ...]]
const MARCADOR = /\[\[\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]\]/g;

describe('temario', () => {
  it('listarTemario ordena comunes y luego específicos por numero', async () => {
    for (const perfil of ['c1', 'a2'] as const) {
      const temas = await listarTemario(perfil);
      expect(Array.isArray(temas)).toBe(true);
      let fase: 'comun' | 'especifico' = 'comun';
      let ultimo = 0;
      for (const t of temas) {
        expect(t.id).toMatch(/^HUE-(C1|A2)-/);
        expect(t.titulo.length).toBeGreaterThan(0);
        expect(t.secciones.length).toBeGreaterThan(0);
        if (t.tipo !== fase) {
          expect(t.tipo).toBe('especifico');
          fase = 'especifico';
          ultimo = 0;
        }
        expect(t.numero).toBeGreaterThanOrEqual(ultimo);
        ultimo = t.numero;
      }
    }
  });

  it('obtenerTema resuelve por id y null si no existe', async () => {
    const temas = await listarTemario('a2');
    if (temas.length > 0) {
      expect(await obtenerTema('a2', temas[0].id)).toEqual(temas[0]);
    }
    expect(await obtenerTema('a2', 'HUE-A2-NOEXISTE')).toBeNull();
    expect(await obtenerTema('c1', 'HUE-C1-NOEXISTE')).toBeNull();
  });

  it('temasRelacionados solo devuelve temas existentes', async () => {
    const temas = await listarTemario('a2');
    if (temas.length === 0) return;
    const rels = await temasRelacionados('a2', temas[0]);
    for (const r of rels) {
      expect(r.id).not.toBe(temas[0].id);
      expect(temas.map((t) => t.id)).toContain(r.id);
    }
  });
});

describe('estructura del temario (100 JSON)', () => {
  const perfiles = ['c1', 'a2'] as const;
  const esperados: Record<(typeof perfiles)[number], number> = {
    c1: 40,
    a2: 60,
  };

  it('existen 40 temas C1 y 60 temas A2', async () => {
    for (const perfil of perfiles) {
      const temas = await listarTemario(perfil);
      expect(temas).toHaveLength(esperados[perfil]);
    }
  });

  it('campos obligatorios no vacíos y tipo/numero coherentes con el id', async () => {
    for (const perfil of perfiles) {
      const temas = await listarTemario(perfil);
      for (const t of temas) {
        expect(t.id, 'id').toMatch(
          perfil === 'c1' ? /^HUE-C1-(T|E)\d{2}$/ : /^HUE-A2-(T|E)\d{2}$/,
        );
        expect(t.tema.trim().length, `${t.id} tema`).toBeGreaterThan(0);
        expect(t.titulo.trim().length, `${t.id} titulo`).toBeGreaterThan(0);
        const esEspecifico = t.id.includes('-E');
        expect(t.tipo, `${t.id} tipo`).toBe(
          esEspecifico ? 'especifico' : 'comun',
        );
        expect(t.numero, `${t.id} numero`).toBe(Number(t.id.slice(-2)));
        expect(t.secciones.length, `${t.id} secciones`).toBeGreaterThanOrEqual(
          2,
        );
        for (const s of t.secciones) {
          expect(
            s.titulo.trim().length,
            `${t.id} seccion titulo`,
          ).toBeGreaterThan(0);
          expect(
            s.texto.trim().length,
            `${t.id} seccion texto`,
          ).toBeGreaterThan(0);
        }
        expect(Array.isArray(t.relacionados), `${t.id} relacionados`).toBe(true);
      }
    }
  });

  it('todos los marcadores [[ley | art.]] tienen formato válido, ley conocida y cita parseable', async () => {
    let total = 0;
    for (const perfil of perfiles) {
      const temas = await listarTemario(perfil);
      for (const t of temas) {
        for (const s of t.secciones) {
          const texto = s.texto;
          MARCADOR.lastIndex = 0;
          let m: RegExpExecArray | null;
          let validos = 0;
          while ((m = MARCADOR.exec(texto)) !== null) {
            total++;
            validos++;
            const ley = m[1].trim();
            const cita = m[2].trim();
            expect(LEYES.has(ley), `${t.id}: ley desconocida «${ley}»`).toBe(
              true,
            );
            expect(cita, `${t.id}: cita sin formato art. «${cita}»`).toMatch(
              /^arts?\.\s*.+$/i,
            );
            expect(
              parseCita(cita),
              `${t.id}: cita no parseable «${cita}»`,
            ).not.toBeNull();
          }
          // sin restos de marcadores rotos: cada «[[» debe pertenecer a un marcador válido
          const aperturas = (texto.match(/\[\[/g) ?? []).length;
          expect(
            aperturas,
            `${t.id}: «[[» sin marcador válido`,
          ).toBe(validos);
        }
      }
    }
    expect(total).toBeGreaterThan(0);
  });

  it('todos los ids de relacionados existen en el mismo perfil', async () => {
    for (const perfil of perfiles) {
      const temas = await listarTemario(perfil);
      const ids = new Set(temas.map((t) => t.id));
      for (const t of temas) {
        for (const rid of t.relacionados) {
          expect(ids.has(rid), `${t.id}: relacionado inexistente ${rid}`).toBe(
            true,
          );
          expect(rid, `${t.id}: autorreferencia`).not.toBe(t.id);
        }
      }
    }
  });
});

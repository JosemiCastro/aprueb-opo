import { describe, expect, it } from 'vitest';
import {
  esquemaDeTema,
  oposicionDe,
  oposiciones,
  preguntasDeTema,
  questionIdsDeTema,
  temas,
  temasDe,
  temasDeOpo,
  tituloTema,
  todasPreguntas,
  todosEsquemas,
} from './data';
import mapa from '../data/mapa.json';
import type { OposicionId } from '../types';

const LEYES = new Set(Object.keys(mapa as Record<string, unknown>));

describe('data', () => {
  it('Huelva mantiene sus 100 temas (A2 12+48, C1 8+32)', () => {
    expect(temasDeOpo('HUE-A2')).toHaveLength(60);
    expect(temasDeOpo('HUE-C1')).toHaveLength(40);
    expect(temasDeOpo('HUE-A2').filter((t) => t.tipo === 'comun')).toHaveLength(12);
    expect(temasDeOpo('HUE-A2').filter((t) => t.tipo === 'especifico')).toHaveLength(48);
    expect(temasDeOpo('HUE-C1').filter((t) => t.tipo === 'comun')).toHaveLength(8);
    expect(temasDeOpo('HUE-C1').filter((t) => t.tipo === 'especifico')).toHaveLength(32);
  });

  it('temasDe sigue siendo compatible con Huelva', () => {
    expect(temasDe('a2')).toHaveLength(60);
    expect(temasDe('c1')).toHaveLength(40);
  });

  it('cada oposición tiene sus temas y no hay mezcla entre oposiciones', () => {
    const vistas = new Set<string>();
    for (const o of oposiciones) {
      const ts = temasDeOpo(o.id);
      expect(ts.length, o.id).toBeGreaterThan(0);
      for (const t of ts) {
        const clave = `${o.id}:${t.id}`;
        expect(vistas.has(clave), `tema duplicado ${clave}`).toBe(false);
        vistas.add(clave);
      }
    }
    // Los IDs cortos (T01/E01) se reutilizan entre oposiciones sin colisión.
    const cortos = temas.map((t) => t.id);
    expect(new Set(cortos).size).toBeLessThan(cortos.length);
  });

  it('carga las 800 preguntas C1 de Huelva y los 60 esquemas A2', () => {
    expect(todasPreguntas('HUE-C1')).toHaveLength(800);
    expect(todosEsquemas()).toHaveLength(60);
  });

  it('preguntasDeTema filtra por oposición', () => {
    expect(preguntasDeTema('T01', 'HUE-C1').length).toBeGreaterThan(0);
    expect(preguntasDeTema('E01', 'HUE-C1').length).toBeGreaterThan(0);
    expect(questionIdsDeTema('E01', 'HUE-C1')).toEqual(
      preguntasDeTema('E01', 'HUE-C1').map((q) => q.id),
    );
    // Con filtro por oposición no hay mezcla entre oposiciones.
    for (const q of preguntasDeTema('T01', 'HUE-C1')) {
      expect(q.id.startsWith('HUE-C1-')).toBe(true);
    }
  });

  it('esquemaDeTema y tituloTema resuelven por oposición', () => {
    expect(esquemaDeTema('E01').id).toBe('HUE-A2-E01');
    expect(esquemaDeTema('T05').puntos_clave.length).toBeGreaterThan(0);
    expect(tituloTema('HUE-C1', 'T01')).toContain('Constituci');
    expect(tituloTema('HUE-A2', 'E01')).toContain('Procedimiento Administrativo');
  });

  it('oposicionDe y metadatos de las 9 oposiciones', () => {
    expect(oposiciones).toHaveLength(9);
    const ids = oposiciones.map((o) => o.id);
    expect(new Set(ids).size).toBe(9);
    for (const o of oposiciones) {
      expect(oposicionDe(o.id)).toBe(o);
      expect(o.diputacion.length).toBeGreaterThan(0);
      expect(o.cuerpo.length).toBeGreaterThan(0);
      expect(o.grupo).toMatch(/^(?:[CA][12]|B0[2-4])$/);
      expect(o.plazas).toBeGreaterThan(0);
      expect(o.bop.length).toBeGreaterThan(0);
    }
  });
});

describe('validación de datos de las nuevas oposiciones', () => {
  const NUEVAS: OposicionId[] = ['CAD-C2', 'GRA-C1', 'SEV-A1', 'CSUR-RED', 'CSUR-PRO', 'CSUR-AYP', 'CSUR-PPR'];

  it('todas las preguntas tienen id único con prefijo de su oposición', () => {
    const vistos = new Set<string>();
    for (const q of todasPreguntas()) {
      expect(vistos.has(q.id), `id duplicado ${q.id}`).toBe(false);
      vistos.add(q.id);
    }
    for (const opoId of NUEVAS) {
      const qs = todasPreguntas(opoId);
      expect(qs.length, `${opoId} sin preguntas`).toBeGreaterThan(0);
      for (const q of qs) {
        expect(q.id.startsWith(`${opoId}-`), `${q.id} sin prefijo`).toBe(true);
        expect(q.enunciado.trim().length, `${q.id} enunciado`).toBeGreaterThan(0);
        expect(q.respuesta.trim().length, `${q.id} respuesta`).toBeGreaterThan(0);
      }
    }
  });

  it('el tema de cada pregunta existe en su oposición', () => {
    for (const opoId of NUEVAS) {
      const ids = new Set(temasDeOpo(opoId).map((t) => t.id));
      const norm = (t: string | number): string => {
        if (typeof t === 'number') return 'T' + String(t).padStart(2, '0');
        const s = String(t).trim().toUpperCase();
        const m = s.match(/^([TE]?)(\d{1,2})$/);
        return m ? (m[1] || 'T') + m[2].padStart(2, '0') : s;
      };
      for (const q of todasPreguntas(opoId)) {
        expect(ids.has(norm(q.tema)), `${q.id}: tema ${q.tema} inexistente`).toBe(true);
      }
    }
  });

  it('toda ley citada existe en mapa.json', () => {
    for (const q of todasPreguntas()) {
      expect(LEYES.has(q.ley), `${q.id}: ley desconocida «${q.ley}»`).toBe(true);
    }
  });

  it('cada tema de las nuevas oposiciones tiene preguntas', () => {
    for (const opoId of NUEVAS) {
      for (const t of temasDeOpo(opoId)) {
        expect(
          preguntasDeTema(t.id, opoId).length,
          `${opoId} ${t.id} sin preguntas`,
        ).toBeGreaterThan(0);
      }
    }
  });
});

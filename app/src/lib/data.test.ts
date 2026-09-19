import { describe, expect, it } from 'vitest';
import {
  esquemaDeTema,
  preguntasDeTema,
  questionIdsDeTema,
  temas,
  temasDe,
  tituloTema,
  todasPreguntas,
  todosEsquemas,
} from './data';

describe('data', () => {
  it('temas.json tiene 100 temas (A2 12+48, C1 8+32)', () => {
    expect(temas).toHaveLength(100);
    expect(temasDe('a2')).toHaveLength(60);
    expect(temasDe('c1')).toHaveLength(40);
    expect(temasDe('a2').filter((t) => t.tipo === 'comun')).toHaveLength(12);
    expect(temasDe('a2').filter((t) => t.tipo === 'especifico')).toHaveLength(48);
    expect(temasDe('c1').filter((t) => t.tipo === 'comun')).toHaveLength(8);
    expect(temasDe('c1').filter((t) => t.tipo === 'especifico')).toHaveLength(32);
  });

  it('carga las 800 preguntas C1 y los 60 esquemas A2', () => {
    expect(todasPreguntas()).toHaveLength(800);
    expect(todosEsquemas()).toHaveLength(60);
  });

  it('preguntasDeTema normaliza tema numérico y "E01"', () => {
    expect(preguntasDeTema('T01').length).toBeGreaterThan(0);
    expect(preguntasDeTema('E01').length).toBeGreaterThan(0);
    expect(questionIdsDeTema('E01')).toEqual(preguntasDeTema('E01').map((q) => q.id));
  });

  it('esquemaDeTema y tituloTema resuelven por perfil', () => {
    expect(esquemaDeTema('E01').id).toBe('HUE-A2-E01');
    expect(esquemaDeTema('T05').puntos_clave.length).toBeGreaterThan(0);
    expect(tituloTema('c1', 'T01')).toContain('Constituci');
    expect(tituloTema('a2', 'E01')).toContain('Procedimiento Administrativo');
  });
});

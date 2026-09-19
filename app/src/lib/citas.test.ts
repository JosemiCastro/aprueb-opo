import { describe, expect, it } from 'vitest';
import { parseCita } from './citas';

describe('parseCita', () => {
  it('artículo simple con apartado', () => {
    expect(parseCita('art. 1.3')).toEqual([{ numero: 1, sub: '3' }]);
  });

  it('artículo con subapartados con letras', () => {
    expect(parseCita('art. 4.1.a)')).toEqual([{ numero: 4, sub: '1.a' }]);
  });

  it('lista de artículos', () => {
    expect(parseCita('arts. 68, 71 y 82')?.map((r) => r.numero)).toEqual([
      68, 71, 82,
    ]);
  });

  it('rango con "a"', () => {
    expect(parseCita('arts. 9 a 11')?.map((r) => r.numero)).toEqual([9, 10, 11]);
  });

  it('rango con guion', () => {
    expect(parseCita('arts. 34-36')?.map((r) => r.numero)).toEqual([34, 35, 36]);
  });

  it('citas no concretas no son pulsables', () => {
    expect(parseCita('—')).toBeNull();
    expect(parseCita('')).toBeNull();
    expect(parseCita('Estructura: Título Preliminar (arts. 1-52)')).toBeNull();
  });

  it('cita mixta con otra ley: usa los artículos de la ley principal', () => {
    const refs = parseCita('arts. 85.2.A).d) y 85 ter LBRL; art. 46.4 LAULA');
    expect(refs?.map((r) => r.numero)).toEqual([46, 85]);
  });
});

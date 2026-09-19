import { describe, expect, it } from 'vitest';
import { esTemaEstudiado, setTemaEstudiado } from './storage';

describe('temasEstudiados', () => {
  it('marca y desmarca de forma inmutable', () => {
    const v0 = {};
    const v1 = setTemaEstudiado(v0, 'HUE-C1-T01', true);
    expect(v1).toEqual({ 'HUE-C1-T01': true });
    expect(v0).toEqual({});
    expect(esTemaEstudiado(v1, 'HUE-C1-T01')).toBe(true);
    expect(esTemaEstudiado(v1, 'HUE-C1-T02')).toBe(false);

    const v2 = setTemaEstudiado(v1, 'HUE-C1-T01', false);
    expect(v2).toEqual({});
    expect(v1).toEqual({ 'HUE-C1-T01': true }); // el previo no muta
    expect(esTemaEstudiado(v2, 'HUE-C1-T01')).toBe(false);
  });

  it('es idempotente', () => {
    const v1 = setTemaEstudiado({}, 'HUE-A2-T01', true);
    expect(setTemaEstudiado(v1, 'HUE-A2-T01', true)).toBe(v1);
    const v0 = setTemaEstudiado({}, 'HUE-A2-T01', false);
    expect(v0).toEqual({});
  });

  it('acumula varios temas', () => {
    let v = {};
    v = setTemaEstudiado(v, 'HUE-C1-T01', true);
    v = setTemaEstudiado(v, 'HUE-C1-T02', true);
    expect(Object.keys(v)).toHaveLength(2);
    v = setTemaEstudiado(v, 'HUE-C1-T01', false);
    expect(v).toEqual({ 'HUE-C1-T02': true });
  });
});

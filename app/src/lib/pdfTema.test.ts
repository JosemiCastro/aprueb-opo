import { describe, expect, it } from 'vitest';
import { nombreArchivoPdf, nombreCortoLey, slugify, textoPlanoPdf } from './pdfTema';
import type { TemaDesarrollado } from '../types';

function temaDePrueba(titulo: string): TemaDesarrollado {
  return {
    id: 'CSUR-PRO-T01',
    tema: 'T01',
    tipo: 'comun',
    numero: 1,
    titulo,
    secciones: [],
    relacionados: [],
  };
}

describe('nombreArchivoPdf', () => {
  it('nombre legible con id del tema y título sin tildes', () => {
    expect(nombreArchivoPdf(temaDePrueba('La Constitución Española de 1978'))).toBe(
      'OposDipu-CSUR-PRO-T01-la-constitucion-espanola-de-1978.pdf',
    );
  });

  it('sin espacios ni caracteres raros, y con extensión .pdf', () => {
    const nombre = nombreArchivoPdf(
      temaDePrueba('Órganos: Gobierno, ¿qué hace? ¡Todo!'),
    );
    expect(nombre).toMatch(/^OposDipu-CSUR-PRO-T01-[a-z0-9-]+\.pdf$/);
    expect(nombre).toBe('OposDipu-CSUR-PRO-T01-organos-gobierno-que-hace-todo.pdf');
  });

  it('títulos muy largos se recortan', () => {
    const nombre = nombreArchivoPdf(
      temaDePrueba(
        'Un título larguísimo que no cabe en un nombre de archivo razonable y sigue y sigue sin parar',
      ),
    );
    expect(nombre.length).toBeLessThanOrEqual(110);
    expect(nombre.endsWith('.pdf')).toBe(true);
  });
});

describe('slugify', () => {
  it('quita tildes, ñ y signos', () => {
    expect(slugify('Constitución, Estatuto y Organización')).toBe(
      'constitucion-estatuto-y-organizacion',
    );
    expect(slugify('Niño ¿qué?')).toBe('nino-que');
  });
});

describe('nombreCortoLey', () => {
  it('abreviaturas habituales', () => {
    expect(nombreCortoLey('Constitución Española de 1978')).toBe('CE');
    expect(nombreCortoLey('Tratado de la Unión Europea')).toBe('TUE');
  });

  it('títulos largos se recortan por la primera coma', () => {
    expect(
      nombreCortoLey(
        'Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas',
      ),
    ).toBe('Ley 39/2015');
    expect(
      nombreCortoLey(
        'Real Decreto Legislativo 2/2004, de 5 de marzo, por el que se aprueba el texto refundido de la Ley Reguladora de las Haciendas Locales',
      ),
    ).toBe('Real Decreto Legislativo 2/2004');
  });

  it('sin coma se deja como está', () => {
    expect(nombreCortoLey('Ley 18/2007')).toBe('Ley 18/2007');
    expect(nombreCortoLey('X Convenio Colectivo de RTVA')).toBe(
      'X Convenio Colectivo de RTVA',
    );
  });
});

describe('textoPlanoPdf', () => {
  it('citas [[ley | art.]] pasan a texto entre paréntesis', () => {
    expect(
      textoPlanoPdf('Ver [[Ley 18/2007 | art. 17]] y [[Ley 2/2024 | arts. 1 y 2]].'),
    ).toBe('Ver Ley 18/2007 (art. 17) y Ley 2/2024 (arts. 1 y 2).');
  });

  it('la Constitución y los títulos largos usan el nombre corto', () => {
    expect(
      textoPlanoPdf(
        'El [[Constitución Española de 1978 | art. 1]] define a España y la [[Ley 39/2015, de 1 de octubre, del Procedimiento Administrativo Común de las Administraciones Públicas | art. 2]] regula el procedimiento.',
      ),
    ).toBe(
      'El CE (art. 1) define a España y la Ley 39/2015 (art. 2) regula el procedimiento.',
    );
  });

  it('negrita y cursiva se quedan como texto plano', () => {
    expect(textoPlanoPdf('Esto es **importante** y esto *también*.')).toBe(
      'Esto es importante y esto también.',
    );
  });

  it('marcador mal formado se deja como texto sin corchetes', () => {
    expect(textoPlanoPdf('Ver [[solo texto]] aquí.')).toBe('Ver solo texto aquí.');
  });

  it('colapsa espacios y saltos de línea', () => {
    expect(textoPlanoPdf('  Hola\n   mundo  ')).toBe('Hola mundo');
  });
});

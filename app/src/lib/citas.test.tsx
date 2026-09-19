import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseCita, renderTextoConCitas } from './citas';

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

describe('renderTextoConCitas', () => {
  const html = (t: string): string =>
    renderToStaticMarkup(<>{renderTextoConCitas(t)}</>);

  it('marcador básico se convierte en pastilla pulsable', () => {
    const h = html(
      'Según la [[Constitución Española de 1978 | art. 1.1]], España es un Estado social.',
    );
    expect(h).toContain('cita-pill-btn');
    expect(h).toContain('Constitución Española de 1978 · art. 1.1');
    expect(h).not.toContain('[[');
    expect(h.startsWith('<p')).toBe(true);
  });

  it('varios marcadores en el mismo bloque', () => {
    const h = html(
      'Ver [[Constitución Española de 1978 | art. 1]] y [[Constitución Española de 1978 | art. 2]].',
    );
    expect(h.match(/cita-pill-btn/g)).toHaveLength(2);
  });

  it('marcador roto queda como texto plano', () => {
    const h = html('Roto [[sin cierre y [[sin barra]] fin.');
    expect(h).toContain('[[sin cierre');
    expect(h).toContain('[[sin barra]]');
    expect(h).not.toContain('cita-pill');
  });

  it('cita no concreta se muestra como pastilla no pulsable', () => {
    const h = html('Texto [[Alguna Ley | —]] final.');
    expect(h).toContain('cita-pill');
    expect(h).not.toContain('cita-pill-btn');
    expect(h).toContain('Alguna Ley · —');
  });

  it('combina markdown: h4, listas, negrita y cursiva', () => {
    const h = html(
      '### Título\n\n- uno **dos**\n- tres *cuatro*\n\n1. paso uno\n2. paso dos\n\nPárrafo final.',
    );
    expect(h).toContain('<h4 class="temario-h4">Título</h4>');
    expect(h).toContain('<ul class="temario-ul">');
    expect(h).toContain('<ol class="temario-ol">');
    expect(h).toContain('<strong>dos</strong>');
    expect(h).toContain('<em>cuatro</em>');
    expect(h).toContain('<p class="temario-p">Párrafo final.</p>');
  });

  it('cita dentro de lista y de negrita', () => {
    const h = html(
      '- punto con [[Constitución Española de 1978 | art. 9.1]]\n\n**ver [[Constitución Española de 1978 | art. 10]]**',
    );
    expect(h.match(/cita-pill-btn/g)).toHaveLength(2);
    expect(h).toContain('<li>');
    expect(h).toContain('<strong>');
  });

  it('bloques vacíos no generan nodos', () => {
    expect(renderTextoConCitas('')).toEqual([]);
    expect(renderTextoConCitas('\n\n   \n')).toEqual([]);
  });
});

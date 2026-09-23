import { Header } from '../components/ui';
import { baseDeOpo, oposiciones, todasPreguntas, temasDeOpo } from '../lib/data';
import { link } from '../lib/router';
import type { EstadoOposicion, Oposicion } from '../types';

export const ESTADO_LABEL: Record<EstadoOposicion, string> = {
  'plazo-abierto': 'Plazo abierto',
  'bases-publicadas': 'Bases publicadas',
  'pendiente-boe': 'Pendiente de BOE',
};

function EstadoBadge({ estado }: { estado: EstadoOposicion }) {
  return (
    <span className={`estado-badge estado-${estado}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export function OpoCard({ opo }: { opo: Oposicion }) {
  const base = baseDeOpo(opo.id);
  const nTemas = temasDeOpo(opo.id).length;
  const nPreguntas = todasPreguntas(opo.id).length;
  return (
    <article className="opo-card">
      <div className="opo-card-top">
        <span className="opo-grupo">{opo.grupo}</span>
        <EstadoBadge estado={opo.estado} />
      </div>
      <h3 className="opo-cuerpo">{opo.cuerpo}</h3>
      <p className="opo-diputacion">Diputación de {opo.diputacion}</p>
      <p className="opo-meta">
        {opo.plazas} plazas · {opo.plazasDetalle}
      </p>
      {opo.plazo ? <p className="opo-plazo">⏳ {opo.plazo}</p> : null}
      <p className="opo-stats">
        {nTemas > 0 ? `${nTemas} temas` : 'Temario en preparación'}
        {nPreguntas > 0 ? ` · ${nPreguntas} preguntas` : ''}
      </p>
      <div className="opo-fuentes">
        <span className="opo-fuente">{opo.bop}</span>
        {opo.bopUrl ? (
          <a href={opo.bopUrl} target="_blank" rel="noreferrer">
            Ver bases ↗
          </a>
        ) : null}
        {opo.boe ? <span className="opo-fuente">{opo.boe}</span> : null}
        {opo.boeUrl ? (
          <a href={opo.boeUrl} target="_blank" rel="noreferrer">
            Ver BOE ↗
          </a>
        ) : null}
      </div>
      <a className="opo-cta" href={link(base)}>
        Estudiar ›
      </a>
    </article>
  );
}

const ORDEN_DIPUTACION = ['Huelva', 'Cádiz', 'Granada', 'Sevilla (OPAEF)'];

export default function Oposiciones() {
  const grupos = ORDEN_DIPUTACION.map((dip) => ({
    dip,
    opos: oposiciones.filter((o) => o.diputacion === dip),
  })).filter((g) => g.opos.length > 0);

  return (
    <div className="screen">
      <Header title="Oposiciones" backTo="/" />
      <main className="container">
        {grupos.map((g) => (
          <section key={g.dip} aria-label={`Diputación de ${g.dip}`}>
            <h2 className="temario-grupo">Diputación de {g.dip}</h2>
            <div className="opo-grid">
              {g.opos.map((o) => (
                <OpoCard key={o.id} opo={o} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

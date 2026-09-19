import { Header, TemaRow } from '../../components/ui';
import { temasDe, preguntasDeTema, questionIdsDeTema } from '../../lib/data';
import { masteryPct } from '../../lib/progress';
import { link } from '../../lib/router';
import { useProgress } from '../../lib/storage';

export default function TemasC1() {
  const [progress] = useProgress();
  const temas = temasDe('c1');

  return (
    <div className="screen">
      <Header title="C1 · Administrativo" backTo="/" />
      <main className="container">
        <div className="actions-row">
          <a className="btn btn-primary" href={link('/c1/test')}>Hacer test</a>
          <a className="btn btn-ghost" href={link('/c1/repaso')}>Repasar falladas</a>
        </div>
        <a className="temario-entry" href={link('/c1/temario')}>
          <span className="temario-entry-ico" aria-hidden="true">📖</span>
          <span className="temario-entry-text">
            <strong>Temario desarrollado</strong>
            <small>Temas completos con artículos pulsables</small>
          </span>
          <span className="tema-row-arrow" aria-hidden="true">›</span>
        </a>
        {temas.map((t) => {
          const preguntas = preguntasDeTema(t.id);
          const { pct } = masteryPct(progress, questionIdsDeTema(t.id));
          return (
            <TemaRow
              key={t.id}
              to={`/c1/tema/${t.id}`}
              title={t.titulo}
              sub={`${preguntas.length} preguntas`}
              pct={pct}
            />
          );
        })}
      </main>
    </div>
  );
}

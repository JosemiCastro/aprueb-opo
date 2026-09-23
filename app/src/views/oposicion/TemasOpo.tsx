import { Header, TemaRow } from '../../components/ui';
import { temasDeOpo, preguntasDeTema, questionIdsDeTema, todasPreguntas } from '../../lib/data';
import { masteryPct } from '../../lib/progress';
import { link } from '../../lib/router';
import { useProgress } from '../../lib/storage';
import { tituloOpo, type OpoProps } from './props';

export default function TemasOpo({ opoId, base }: OpoProps) {
  const [progress] = useProgress();
  const temas = temasDeOpo(opoId);
  const totalPreguntas = todasPreguntas(opoId).length;

  return (
    <div className="screen">
      <Header title={tituloOpo(opoId)} backTo="/" />
      <main className="container">
        <div className="actions-row">
          <a className="btn btn-primary" href={link(`${base}/test`)}>Hacer test</a>
          <a className="btn btn-ghost" href={link(`${base}/repaso`)}>Repasar falladas</a>
        </div>
        <a className="temario-entry" href={link(`${base}/temario`)}>
          <span className="temario-entry-ico" aria-hidden="true">📖</span>
          <span className="temario-entry-text">
            <strong>Temario desarrollado</strong>
            <small>Temas completos con artículos pulsables</small>
          </span>
          <span className="tema-row-arrow" aria-hidden="true">›</span>
        </a>
        <p className="temas-count">
          {temas.length} temas · {totalPreguntas} preguntas
        </p>
        {temas.map((t) => {
          const preguntas = preguntasDeTema(t.id, opoId);
          const { pct } = masteryPct(progress, questionIdsDeTema(t.id, opoId));
          return (
            <TemaRow
              key={t.id}
              to={`${base}/tema/${t.id}`}
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

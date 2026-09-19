import { Header, TemaRow } from '../../components/ui';
import { esquemaDeTema, temasDe } from '../../lib/data';
import { useProgress } from '../../lib/storage';
import { link } from '../../lib/router';
import type { TemaMeta } from '../../types';

function pctTema(checks: Record<string, boolean[]>, id: string): number {
  const esquema = esquemaDeTema(id);
  const total = esquema.checklist.length;
  if (total === 0) return 0;
  const arr = checks[esquema.id];
  if (!arr) return 0;
  const marcados = arr.slice(0, total).filter(Boolean).length;
  return Math.round((marcados / total) * 100);
}

function subTema(t: TemaMeta): string {
  return t.tipo === 'comun' ? 'Tema común' : 'Tema específico';
}

export default function TemasA2() {
  const [progress] = useProgress();
  const temas = temasDe('a2');
  const comunes = temas.filter((t) => t.tipo === 'comun');
  const especificos = temas.filter((t) => t.tipo === 'especifico');

  return (
    <div className="screen">
      <Header title="A2 · Técnico de Gestión" backTo="/" />
      <main className="container">
        <a className="temario-entry" href={link('/a2/temario')}>
          <span className="temario-entry-ico" aria-hidden="true">📖</span>
          <span className="temario-entry-text">
            <strong>Temario desarrollado</strong>
            <small>Temas completos con artículos pulsables</small>
          </span>
          <span className="tema-row-arrow" aria-hidden="true">›</span>
        </a>
        <h2>Temas comunes</h2>
        {comunes.map((t) => (
          <TemaRow
            key={t.id}
            to={`/a2/tema/${t.id}`}
            title={t.titulo}
            sub={subTema(t)}
            pct={pctTema(progress.checks, t.id)}
          />
        ))}
        <h2>Específicos</h2>
        {especificos.map((t) => (
          <TemaRow
            key={t.id}
            to={`/a2/tema/${t.id}`}
            title={t.titulo}
            sub={subTema(t)}
            pct={pctTema(progress.checks, t.id)}
          />
        ))}
      </main>
    </div>
  );
}

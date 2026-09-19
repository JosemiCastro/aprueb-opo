import type { CSSProperties } from 'react';
import { Card, Header, ProgressBar } from '../components/ui';
import { esquemaDeTema, temasDe, tituloTema, todasPreguntas } from '../lib/data';
import { grade, masteryPct, streakDays } from '../lib/progress';
import { useProgress } from '../lib/storage';
import type { SessionRec } from '../types';

const MODO_LABEL: Record<SessionRec['modo'], string> = {
  estudio: 'Estudio',
  test: 'Test',
  repaso: 'Repaso',
  ficha: 'Ficha',
};

const PERFIL_LABEL: Record<SessionRec['perfil'], string> = {
  c1: 'C1',
  a2: 'A2',
};

const listReset: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 };

const histItem: CSSProperties = { padding: '10px 0', borderBottom: '1px solid #dbe3f0' };

const histMeta: CSSProperties = { fontSize: '0.875rem', color: '#5b6b82', marginTop: 2 };

const muted: CSSProperties = { color: '#5b6b82', margin: '8px 0 0' };

const statBig: CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 700,
  color: '#1a56db',
  margin: '8px 0 0',
};

// % de checklist completada para un tema A2
function pctChecks(checks: Record<string, boolean[]>, temaId: string): number {
  const esquema = esquemaDeTema(temaId);
  const total = esquema.checklist.length;
  if (total === 0) return 0;
  const arr = checks[esquema.id] ?? [];
  const marcados = arr.slice(0, total).filter(Boolean).length;
  return (marcados / total) * 100;
}

function temaDominado(checks: Record<string, boolean[]>, temaId: string): boolean {
  const esquema = esquemaDeTema(temaId);
  const total = esquema.checklist.length;
  if (total === 0) return false;
  const arr = checks[esquema.id] ?? [];
  return arr.length >= total && arr.slice(0, total).every(Boolean);
}

export default function Progreso() {
  const [progress] = useProgress();

  const c1 = masteryPct(
    progress,
    todasPreguntas().map((q) => q.id),
  );

  const temasA2 = temasDe('a2');
  const pcts = temasA2.map((t) => pctChecks(progress.checks, t.id));
  const pctMedio =
    temasA2.length > 0
      ? Math.round(pcts.reduce((a, b) => a + b, 0) / temasA2.length)
      : 0;
  const dominados = temasA2.filter((t) => temaDominado(progress.checks, t.id)).length;

  const racha = streakDays(progress);
  const historial = progress.sessions.slice(-20).reverse();

  return (
    <div className="screen">
      <Header title="Mi progreso" backTo="/" />
      <main className="container">
        <Card>
          <h2>C1 · Administrativo</h2>
          <ProgressBar pct={c1.pct} />
          <p style={muted}>
            {c1.pct}% · {c1.done} de {c1.total} preguntas intentadas
          </p>
        </Card>
        <Card>
          <h2>A2 · Gestión</h2>
          <ProgressBar pct={pctMedio} />
          <p style={muted}>
            {dominados} de {temasA2.length} temas dominados
          </p>
        </Card>
        <Card>
          <h2>Racha</h2>
          <p style={statBig}>
            {racha} {racha === 1 ? 'día' : 'días'}
          </p>
        </Card>
        <Card>
          <h2>Historial</h2>
          {historial.length === 0 ? (
            <p style={muted}>
              Aún no hay sesiones registradas. Empieza a estudiar y aquí verás tu
              historial.
            </p>
          ) : (
            <ul style={listReset}>
              {historial.map((s, i) => (
                <li key={`${s.date}-${s.modo}-${i}`} style={histItem}>
                  <div>
                    <strong>{MODO_LABEL[s.modo]}</strong> · {PERFIL_LABEL[s.perfil]}
                    {s.temaId ? ` · ${tituloTema(s.perfil, s.temaId)}` : null}
                  </div>
                  <div style={histMeta}>
                    {s.date} — {s.aciertos}/{s.total} aciertos
                    {s.modo === 'test'
                      ? ` · Nota: ${grade(s.aciertos, s.total).toFixed(1)}`
                      : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

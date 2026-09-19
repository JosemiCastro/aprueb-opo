import type { CSSProperties } from 'react';
import { Card, Header } from '../../components/ui';
import { esquemaDeTema, tituloTema } from '../../lib/data';
import { recordSession, setCheck } from '../../lib/progress';
import { useProgress } from '../../lib/storage';

const chipStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#1a56db',
  background: '#e8eefb',
  borderRadius: 999,
  padding: '2px 10px',
  marginTop: 6,
};

const badgeStyle: CSSProperties = {
  display: 'inline-block',
  fontWeight: 700,
  color: '#16803c',
  background: '#e4f4e9',
  borderRadius: 999,
  padding: '6px 14px',
  margin: '0 0 12px',
};

const listReset: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 };

const puntoItem: CSSProperties = { padding: '10px 0', borderBottom: '1px solid #dbe3f0' };

const checkItem: CSSProperties = { padding: '6px 0' };

const checkLabel: CSSProperties = {
  display: 'flex',
  gap: 10,
  alignItems: 'flex-start',
  cursor: 'pointer',
};

const checkInput: CSSProperties = {
  width: 22,
  height: 22,
  marginTop: 2,
  flexShrink: 0,
  accentColor: '#1a56db',
};

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// checks normalizados a `total` booleanos (undefined -> todo false)
function checksArray(checks: boolean[] | undefined, total: number): boolean[] {
  const out = new Array<boolean>(total).fill(false);
  if (checks) {
    for (let i = 0; i < Math.min(checks.length, total); i++) out[i] = checks[i];
  }
  return out;
}

function allMarked(checks: boolean[] | undefined, total: number): boolean {
  return total > 0 && checksArray(checks, total).every(Boolean);
}

export default function FichaTema({ temaId }: { temaId: string }) {
  const [progress, setProgress] = useProgress();
  const esquema = esquemaDeTema(temaId);
  const total = esquema.checklist.length;
  const checks = checksArray(progress.checks[esquema.id], total);
  const dominado = allMarked(progress.checks[esquema.id], total);

  const onToggle = (idx: number, val: boolean) => {
    setProgress((prev) => {
      const beforeAll = allMarked(prev.checks[esquema.id], total);
      const after = setCheck(prev, esquema.id, idx, val);
      const afterAll = allMarked(after.checks[esquema.id], total);
      // Solo la primera vez que se completa: transición a todo-marcado
      if (!beforeAll && afterAll) {
        return recordSession(after, {
          date: todayStr(),
          perfil: 'a2',
          modo: 'ficha',
          temaId,
          total,
          aciertos: total,
        });
      }
      return after;
    });
  };

  return (
    <div className="screen">
      <Header title={tituloTema('a2', temaId)} backTo="/a2" />
      <main className="container">
        <Card>
          <h2>Puntos clave</h2>
          <ul style={listReset}>
            {esquema.puntos_clave.map((p, i) => (
              <li key={i} style={puntoItem}>
                <div>{p.punto}</div>
                <span style={chipStyle}>
                  {p.ley} · {p.articulo}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2>Autoevaluación</h2>
          {dominado ? <p style={badgeStyle}>Tema dominado ✓</p> : null}
          <ul style={listReset}>
            {esquema.checklist.map((item, i) => (
              <li key={i} style={checkItem}>
                <label style={checkLabel}>
                  <input
                    type="checkbox"
                    style={checkInput}
                    checked={checks[i]}
                    onChange={(e) => onToggle(i, e.target.checked)}
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}

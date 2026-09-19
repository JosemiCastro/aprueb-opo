import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Question } from '../../types';
import { Header, Btn, Card } from '../../components/ui';
import { todasPreguntas } from '../../lib/data';
import { failedIds, isDominated } from '../../lib/progress';
import { useProgress } from '../../lib/storage';
import { navigate } from '../../lib/router';

type Ambito = 'todos' | 'pendientes' | 'falladas';

const CFG_KEY = 'oposdipu-testcfg';

const AMBITOS: { id: Ambito; label: string; hint: string }[] = [
  { id: 'todos', label: 'Todas', hint: 'todas las preguntas del C1' },
  { id: 'pendientes', label: 'Pendientes', hint: 'no dominadas todavía' },
  { id: 'falladas', label: 'Falladas', hint: 'con fallos pendientes' },
];

const inputStyle: CSSProperties = {
  width: '100%',
  fontFamily: 'inherit',
  fontSize: '1rem',
  padding: '12px',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

export default function TestConfig() {
  const [progress] = useProgress();
  const all = todasPreguntas();
  const max = all.length;

  const [n, setN] = useState(20);
  const [ambito, setAmbito] = useState<Ambito>('todos');
  const [aviso, setAviso] = useState<string | null>(null);

  function poolFor(a: Ambito): Question[] {
    if (a === 'todos') return all;
    if (a === 'pendientes') return all.filter((q) => !isDominated(progress, q.id));
    const byId = new Map(all.map((q) => [q.id, q]));
    return failedIds(progress)
      .map((id) => byId.get(id))
      .filter((q): q is Question => q !== undefined);
  }

  function empezar() {
    const pool = poolFor(ambito);
    if (pool.length === 0) {
      setAviso('No hay preguntas disponibles en este ámbito.');
      return;
    }
    if (pool.length < n) {
      setAviso(
        `Solo hay ${pool.length} preguntas disponibles en este ámbito. Se ha ajustado el número.`,
      );
      setN(pool.length);
      return;
    }
    setAviso(null);
    sessionStorage.setItem(CFG_KEY, JSON.stringify({ n, ambito }));
    navigate('/c1/test/run');
  }

  return (
    <div className="screen">
      <Header title="Test C1" backTo="/c1" />
      <main className="container">
        <Card>
          <label htmlFor="test-n" style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
            Número de preguntas
          </label>
          <input
            id="test-n"
            type="number"
            min={5}
            max={max}
            value={n}
            style={inputStyle}
            onChange={(e) => {
              const v = Number(e.target.value);
              setN(Number.isNaN(v) ? 5 : Math.max(5, Math.min(max, v)));
            }}
          />
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 0 }}>
            Entre 5 y {max} preguntas.
          </p>
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Ámbito</div>
          {AMBITOS.map((a) => {
            const disponibles = poolFor(a.id).length;
            return (
              <label
                key={a.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}
              >
                <input
                  type="radio"
                  name="ambito"
                  value={a.id}
                  checked={ambito === a.id}
                  onChange={() => {
                    setAmbito(a.id);
                    setAviso(null);
                  }}
                />
                <span>
                  <span style={{ fontWeight: 600 }}>{a.label}</span>{' '}
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    — {a.hint} ({disponibles})
                  </span>
                </span>
              </label>
            );
          })}
        </Card>

        {aviso ? (
          <Card>
            <p style={{ margin: 0, color: 'var(--danger)', fontWeight: 600 }}>{aviso}</p>
          </Card>
        ) : null}

        <Btn onClick={empezar}>Empezar test</Btn>
      </main>
    </div>
  );
}

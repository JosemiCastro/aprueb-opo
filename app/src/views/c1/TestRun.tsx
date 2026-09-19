import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Question } from '../../types';
import { Header, ProgressBar, Btn, Card } from '../../components/ui';
import { todasPreguntas } from '../../lib/data';
import { recordAnswer, recordSession, isDominated, failedIds, grade } from '../../lib/progress';
import { useProgress } from '../../lib/storage';
import { navigate } from '../../lib/router';

type Ambito = 'todos' | 'pendientes' | 'falladas';

interface TestCfg {
  n: number;
  ambito: Ambito;
}

const CFG_KEY = 'oposdipu-testcfg';
const RES_KEY = 'oposdipu-testres';

// Normaliza el campo `tema` a IDs 'T01' / 'E05' (misma lógica que src/lib/data.ts).
function normTemaId(t: string | number): string {
  if (typeof t === 'number') return 'T' + String(t).padStart(2, '0');
  const s = t.trim().toUpperCase();
  const m = s.match(/^([TE]?)(\d{1,2})$/);
  if (m) return (m[1] || 'T') + m[2].padStart(2, '0');
  return s;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadCfg(): TestCfg | null {
  try {
    const raw = sessionStorage.getItem(CFG_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<TestCfg>;
    if (typeof v.n !== 'number' || typeof v.ambito !== 'string') return null;
    if (v.ambito !== 'todos' && v.ambito !== 'pendientes' && v.ambito !== 'falladas') return null;
    return { n: v.n, ambito: v.ambito };
  } catch {
    return null;
  }
}

const chipStyle: CSSProperties = {
  display: 'inline-block',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

type Phase = 'pregunta' | 'respuesta';

export default function TestRun() {
  const [cfg] = useState<TestCfg | null>(loadCfg);
  const [progress, setP] = useProgress();
  const [questions] = useState<Question[]>(() => {
    if (!cfg) return [];
    const all = todasPreguntas();
    let pool: Question[];
    if (cfg.ambito === 'todos') {
      pool = all;
    } else if (cfg.ambito === 'pendientes') {
      pool = all.filter((q) => !isDominated(progress, q.id));
    } else {
      const byId = new Map(all.map((q) => [q.id, q]));
      pool = failedIds(progress)
        .map((id) => byId.get(id))
        .filter((q): q is Question => q !== undefined);
    }
    return shuffle(pool).slice(0, Math.max(1, cfg.n));
  });
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('pregunta');
  const [aciertos, setAciertos] = useState(0);
  const [done, setDone] = useState(false);
  const results = useRef<{ temaId: string; ok: boolean }[]>([]);

  useEffect(() => {
    if (!cfg) navigate('/c1/test');
  }, [cfg]);

  if (!cfg) {
    return (
      <div className="screen">
        <main className="container">
          <p className="placeholder">Sin configuración de test…</p>
        </main>
      </div>
    );
  }

  const total = questions.length;

  function finish(respondidas: number, ok: number) {
    const agg = new Map<string, { ok: number; ko: number }>();
    for (const r of results.current) {
      const e = agg.get(r.temaId) ?? { ok: 0, ko: 0 };
      if (r.ok) e.ok++;
      else e.ko++;
      agg.set(r.temaId, e);
    }
    const detalle = [...agg.entries()].map(([temaId, v]) => ({
      temaId,
      ok: v.ok,
      ko: v.ko,
    }));
    sessionStorage.setItem(
      RES_KEY,
      JSON.stringify({ aciertos: ok, total: respondidas, nota: grade(ok, respondidas), detalle }),
    );
    setP((prev) =>
      recordSession(prev, {
        date: todayStr(),
        perfil: 'c1',
        modo: 'test',
        total: respondidas,
        aciertos: ok,
      }),
    );
    navigate('/c1/test/fin');
  }

  function gradeQuestion(ok: boolean) {
    const q = questions[idx];
    setP((prev) => recordAnswer(prev, q.id, ok));
    results.current.push({ temaId: normTemaId(q.tema), ok });
    const nextOk = aciertos + (ok ? 1 : 0);
    setAciertos(nextOk);
    const nextIdx = idx + 1;
    if (nextIdx >= total) {
      setIdx(nextIdx);
      setDone(true);
    } else {
      setIdx(nextIdx);
      setPhase('pregunta');
    }
  }

  if (total === 0) {
    return (
      <div className="screen">
        <Header title="Test C1" backTo="/c1/test" />
        <main className="container">
          <Card>
            <p>No hay preguntas disponibles para este test.</p>
            <Btn onClick={() => navigate('/c1/test')}>Volver</Btn>
          </Card>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="screen">
        <Header title="Test C1" backTo="/c1/test" />
        <main className="container">
          <Card>
            <h2 style={{ marginTop: 0 }}>Test completado</h2>
            <p>
              {aciertos} de {total} acertadas
            </p>
            <Btn onClick={() => finish(total, aciertos)}>Ver resultado</Btn>
          </Card>
        </main>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="screen">
      <Header title="Test C1" backTo="/c1/test" />
      <main className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {idx + 1} / {total}
          </span>
          <div style={{ flex: 1 }}>
            <ProgressBar pct={(idx / total) * 100} />
          </div>
        </div>

        {phase === 'pregunta' ? (
          <Card>
            <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{q.enunciado}</p>
            <Btn onClick={() => setPhase('respuesta')}>Ver respuesta</Btn>
          </Card>
        ) : (
          <>
            <Card>
              <p style={{ fontSize: '1.05rem', fontWeight: 600 }}>{q.enunciado}</p>
            </Card>
            <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
              <p style={{ fontWeight: 700, marginTop: 0 }}>{q.respuesta}</p>
              <p style={{ color: 'var(--text-muted)' }}>{q.explicacion}</p>
              <span style={chipStyle}>
                {q.ley} · {q.articulo}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Btn style={{ flex: 1 }} onClick={() => gradeQuestion(true)}>
                Acerté
              </Btn>
              <Btn style={{ flex: 1 }} variant="ghost" onClick={() => gradeQuestion(false)}>
                Fallé
              </Btn>
            </div>
          </>
        )}

        <Btn variant="ghost" onClick={() => finish(idx, aciertos)}>
          Terminar
        </Btn>
      </main>
    </div>
  );
}

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Question } from '../../types';
import { Header, ProgressBar, Btn, Card } from '../../components/ui';
import { preguntasDeTema, tituloTema } from '../../lib/data';
import { recordAnswer, recordSession } from '../../lib/progress';
import { useProgress } from '../../lib/storage';
import { navigate } from '../../lib/router';

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

type Phase = 'pregunta' | 'respuesta';

const chipStyle: CSSProperties = {
  display: 'inline-block',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '999px',
  padding: '4px 10px',
  fontSize: '0.8rem',
  color: 'var(--text-muted)',
};

export default function EstudioTema({ temaId }: { temaId: string }) {
  const [, setP] = useProgress();
  const [questions] = useState<Question[]>(() => shuffle(preguntasDeTema(temaId)));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('pregunta');
  const [aciertos, setAciertos] = useState(0);
  const [done, setDone] = useState(false);

  const total = questions.length;
  const title = tituloTema('c1', temaId);

  function finish(respondidas: number, ok: number) {
    setP((prev) =>
      recordSession(prev, {
        date: todayStr(),
        perfil: 'c1',
        modo: 'estudio',
        temaId,
        total: respondidas,
        aciertos: ok,
      }),
    );
    navigate('/c1');
  }

  function gradeQuestion(ok: boolean) {
    const q = questions[idx];
    setP((prev) => recordAnswer(prev, q.id, ok));
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
        <Header title={title} backTo="/c1" />
        <main className="container">
          <Card>
            <p>No hay preguntas para este tema todavía.</p>
            <Btn onClick={() => navigate('/c1')}>Volver a temas</Btn>
          </Card>
        </main>
      </div>
    );
  }

  if (done) {
    return (
      <div className="screen">
        <Header title={title} backTo="/c1" />
        <main className="container">
          <Card>
            <h2 style={{ marginTop: 0 }}>Sesión completada</h2>
            <p>
              {aciertos} de {total} acertadas
            </p>
            <Btn onClick={() => finish(total, aciertos)}>Terminar</Btn>
          </Card>
        </main>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="screen">
      <Header title={title} backTo="/c1" />
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
            <div
              className="card"
              style={{ borderLeft: '4px solid var(--success)' }}
            >
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

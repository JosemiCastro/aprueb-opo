import { useEffect, useState } from 'react';
import { Header, Btn, Card } from '../../components/ui';
import { tituloTema } from '../../lib/data';
import { navigate } from '../../lib/router';

interface TemaDetalle {
  temaId: string;
  ok: number;
  ko: number;
}

interface TestRes {
  aciertos: number;
  total: number;
  nota: number;
  detalle: TemaDetalle[];
}

const RES_KEY = 'oposdipu-testres';

function loadRes(): TestRes | null {
  try {
    const raw = sessionStorage.getItem(RES_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<TestRes>;
    if (typeof v.aciertos !== 'number' || typeof v.total !== 'number') return null;
    const nota = typeof v.nota === 'number' ? v.nota : 0;
    const detalle = Array.isArray(v.detalle) ? v.detalle : [];
    return { aciertos: v.aciertos, total: v.total, nota, detalle };
  } catch {
    return null;
  }
}

export default function TestResult() {
  const [res] = useState<TestRes | null>(loadRes);

  useEffect(() => {
    if (!res) navigate('/c1/test');
  }, [res]);

  if (!res) {
    return (
      <div className="screen">
        <main className="container">
          <p className="placeholder">Sin resultado de test…</p>
        </main>
      </div>
    );
  }

  const apto = res.nota >= 5;

  return (
    <div className="screen">
      <Header title="Resultado del test" backTo="/c1" />
      <main className="container">
        <Card>
          <div
            style={{
              fontSize: '3rem',
              fontWeight: 800,
              textAlign: 'center',
              color: apto ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {res.nota.toFixed(1)}
          </div>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '4px 0 12px' }}>
            sobre 10 · {res.aciertos} de {res.total} aciertos
          </p>
          <div
            style={{
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              color: apto ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {apto ? 'APTO ✓' : 'NO APTO'}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Desglose por tema</h3>
          {res.detalle.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Sin respuestas registradas.</p>
          ) : (
            res.detalle.map((d) => (
              <div
                key={d.temaId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '8px 0',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <span style={{ fontWeight: 600 }}>{tituloTema('c1', d.temaId)}</span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>{d.ok} ✓</span>
                  {' / '}
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{d.ko} ✗</span>
                </span>
              </div>
            ))
          )}
        </Card>

        <Btn onClick={() => navigate('/c1/test')}>Nuevo test</Btn>
        <Btn variant="ghost" onClick={() => navigate('/c1')}>
          Temas
        </Btn>
      </main>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Btn, Card, Header } from '../../components/ui';
import { renderTextoConCitas } from '../../lib/citas';
import { listarTemario, temasRelacionados } from '../../lib/temario';
import { recordSession } from '../../lib/progress';
import { esTemaEstudiado, useProgress, useTemasEstudiados } from '../../lib/storage';
import { link } from '../../lib/router';
import type { TemaDesarrollado } from '../../types';

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function DetalleTema({
  perfil,
  temaId,
}: {
  perfil: 'c1' | 'a2';
  temaId: string;
}) {
  const [temas, setTemas] = useState<TemaDesarrollado[] | null>(null);
  const [rels, setRels] = useState<TemaDesarrollado[]>([]);
  const [estudiados, setEstudiado] = useTemasEstudiados();
  const [, setProgress] = useProgress();

  useEffect(() => {
    let vivo = true;
    listarTemario(perfil).then((ts) => {
      if (vivo) setTemas(ts);
    });
    return () => {
      vivo = false;
    };
  }, [perfil]);

  const tema = temas?.find((t) => t.id === temaId) ?? null;

  useEffect(() => {
    let vivo = true;
    if (tema) {
      temasRelacionados(perfil, tema).then((rs) => {
        if (vivo) setRels(rs);
      });
    }
    // Sin tema (cargando o no encontrado) no se muestran: no hace falta limpiar.
    return () => {
      vivo = false;
    };
  }, [perfil, tema]);

  const idx = temas && tema ? temas.findIndex((t) => t.id === tema.id) : -1;
  const anterior = idx > 0 ? temas![idx - 1] : null;
  const siguiente = idx >= 0 && idx < temas!.length - 1 ? temas![idx + 1] : null;
  const estudiado = tema ? esTemaEstudiado(estudiados, tema.id) : false;

  const onToggleEstudiado = () => {
    if (!tema) return;
    const next = !estudiado;
    setEstudiado(tema.id, next);
    // Al marcar como estudiado se registra la sesión en el progreso.
    // Se usa tema.tema ("T01"/"E01") para que el historial resuelva el título.
    if (next) {
      setProgress((p) =>
        recordSession(p, {
          date: todayStr(),
          perfil,
          modo: 'estudio',
          temaId: tema.tema,
          total: 1,
          aciertos: 1,
        }),
      );
    }
  };

  return (
    <div className="screen">
      <Header title={`Tema ${tema?.numero ?? ''}`} backTo={`/${perfil}/temario`} />
      <main className="container">
        <nav className="breadcrumb" aria-label="Miga de pan">
          <a href={link(`/${perfil}`)}>Examen</a>
          <span aria-hidden="true">›</span>
          <a href={link(`/${perfil}/temario`)}>Temario</a>
          <span aria-hidden="true">›</span>
          <span aria-current="page">Tema {tema?.numero ?? '…'}</span>
        </nav>

        {temas === null ? (
          <p className="placeholder">Cargando tema…</p>
        ) : !tema ? (
          <div className="card">
            <p>Este tema no existe en el temario desarrollado.</p>
            <a className="btn btn-ghost" href={link(`/${perfil}/temario`)}>
              Volver al temario
            </a>
          </div>
        ) : (
          <>
            <h1 className="tema-title">{tema.titulo}</h1>

            <Btn
              variant={estudiado ? 'ghost' : 'primary'}
              onClick={onToggleEstudiado}
              aria-pressed={estudiado}
            >
              {estudiado ? '✓ Estudiado — desmarcar' : 'Marcar como estudiado'}
            </Btn>

            {tema.secciones.map((s, i) => (
              <Card key={i}>
                <h2 className="temario-sec-titulo">{s.titulo}</h2>
                <div className="temario-sec-texto">{renderTextoConCitas(s.texto)}</div>
              </Card>
            ))}

            {rels.length > 0 && (
              <section aria-label="Ver también">
                <h2 className="temario-grupo">Ver también</h2>
                <div className="chips-row">
                  {rels.map((r) => (
                    <a
                      key={r.id}
                      className="chip-link"
                      href={link(`/${perfil}/temario/${r.id}`)}
                    >
                      T{r.numero} · {r.titulo}
                    </a>
                  ))}
                </div>
              </section>
            )}

            <nav className="prevnext" aria-label="Tema anterior y siguiente">
              {anterior ? (
                <a className="btn btn-ghost" href={link(`/${perfil}/temario/${anterior.id}`)}>
                  ‹ T{anterior.numero}
                </a>
              ) : (
                <span />
              )}
              {siguiente ? (
                <a className="btn btn-ghost" href={link(`/${perfil}/temario/${siguiente.id}`)}>
                  T{siguiente.numero} ›
                </a>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </main>
    </div>
  );
}

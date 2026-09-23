import { useEffect, useMemo, useState } from 'react';
import { Header } from '../../components/ui';
import { listarTemario } from '../../lib/temario';
import { esTemaEstudiado, useTemasEstudiados } from '../../lib/storage';
import { link } from '../../lib/router';
import { tituloOpo } from '../oposicion/props';
import type { OposicionId, TemaDesarrollado } from '../../types';

function FilaTema({ base, tema, estudiado }: {
  base: string;
  tema: TemaDesarrollado;
  estudiado: boolean;
}) {
  return (
    <a className="tema-row" href={link(`${base}/temario/${tema.id}`)}>
      <span className="tema-num" aria-hidden="true">{tema.numero}</span>
      <div className="tema-row-main">
        <div className="tema-row-title">{tema.titulo}</div>
        <div className="tema-row-sub">
          Tema {tema.numero} · {tema.tipo === 'comun' ? 'Común' : 'Específico'}
        </div>
      </div>
      {estudiado ? (
        <span className="estudiado-chip">✓ Estudiado</span>
      ) : null}
      <span className="tema-row-arrow" aria-hidden="true">›</span>
    </a>
  );
}

export default function ListaTemario({ opoId, base }: { opoId: OposicionId; base: string }) {
  const [temas, setTemas] = useState<TemaDesarrollado[] | null>(null);
  const [q, setQ] = useState('');
  const [estudiados] = useTemasEstudiados();

  useEffect(() => {
    let vivo = true;
    listarTemario(opoId).then((ts) => {
      if (vivo) setTemas(ts);
    });
    return () => {
      vivo = false;
    };
  }, [opoId]);

  const filtrados = useMemo(() => {
    if (!temas) return null;
    const query = q.trim().toLowerCase();
    if (!query) return temas;
    return temas.filter((t) => t.titulo.toLowerCase().includes(query));
  }, [temas, q]);

  const comunes = filtrados?.filter((t) => t.tipo === 'comun') ?? [];
  const especificos = filtrados?.filter((t) => t.tipo === 'especifico') ?? [];

  return (
    <div className="screen">
      <Header title={`📖 Temario ${tituloOpo(opoId)}`} backTo={base} />
      <main className="container">
        <input
          className="input"
          type="search"
          placeholder="Buscar por título…"
          aria-label="Buscar tema por título"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {filtrados === null ? (
          <p className="placeholder">Cargando temario…</p>
        ) : filtrados.length === 0 ? (
          <p className="placeholder">
            {temas?.length === 0
              ? 'El temario desarrollado aún no está disponible. Vuelve pronto.'
              : 'Ningún tema coincide con la búsqueda.'}
          </p>
        ) : (
          <>
            {comunes.length > 0 && (
              <section aria-label="Temas comunes">
                <h2 className="temario-grupo">Temas comunes</h2>
                {comunes.map((t) => (
                  <FilaTema
                    key={t.id}
                    base={base}
                    tema={t}
                    estudiado={esTemaEstudiado(estudiados, t.id)}
                  />
                ))}
              </section>
            )}
            {especificos.length > 0 && (
              <section aria-label="Temas específicos">
                <h2 className="temario-grupo">Temas específicos</h2>
                {especificos.map((t) => (
                  <FilaTema
                    key={t.id}
                    base={base}
                    tema={t}
                    estudiado={esTemaEstudiado(estudiados, t.id)}
                  />
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

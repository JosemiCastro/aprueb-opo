import { useCallback, useEffect, useRef, useState } from 'react';
import { parseCita } from '../lib/citas';

interface Articulo {
  numero: number;
  sub: string;
  titulo: string;
  texto: string;
}

interface RespuestaArticulo {
  ley: string;
  cita: string;
  titulo: string;
  articulos: Articulo[];
  noEncontrados: number[];
}

type Estado =
  | { kind: 'cargando' }
  | { kind: 'error'; mensaje: string }
  | { kind: 'ok'; data: RespuestaArticulo };

function etiquetaArticulo(a: Articulo): string {
  return `Artículo ${a.numero}${a.sub ? `, apartado ${a.sub}` : ''}`;
}

function ArticuloModal({
  ley,
  articulo,
  onClose,
}: {
  ley: string;
  articulo: string;
  onClose: () => void;
}) {
  const [estado, setEstado] = useState<Estado>({ kind: 'cargando' });
  const [sel, setSel] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    let vivo = true;
    const url = `/api/articulo?ley=${encodeURIComponent(ley)}&articulo=${encodeURIComponent(articulo)}`;
    fetch(url)
      .then(async (res) => {
        if (!vivo) return;
        if (!res.ok) {
          let mensaje = 'Artículo no disponible en el corpus local.';
          try {
            const data = (await res.json()) as { message?: string; motivo?: string };
            if (data.message) mensaje = data.message;
            if (data.motivo) mensaje += ` (${data.motivo})`;
          } catch {
            // mensaje por defecto
          }
          setEstado({ kind: 'error', mensaje });
          return;
        }
        const data = (await res.json()) as RespuestaArticulo;
        setEstado({ kind: 'ok', data });
      })
      .catch(() => {
        if (vivo) {
          setEstado({
            kind: 'error',
            mensaje: 'Sin conexión: no se pudo cargar el artículo.',
          });
        }
      });
    return () => {
      vivo = false;
    };
  }, [ley, articulo]);

  const onOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose]
  );

  const actual =
    estado.kind === 'ok'
      ? estado.data.articulos[Math.min(sel, estado.data.articulos.length - 1)]
      : null;

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={onOverlayClick}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Texto del artículo: ${articulo}`}
      >
        <div className="modal-head">
          <div>
            <div className="modal-ley">{estado.kind === 'ok' ? estado.data.titulo : ley}</div>
            <div className="modal-cita">{articulo}</div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {estado.kind === 'cargando' && (
          <p className="modal-loading" aria-live="polite">
            Cargando artículo…
          </p>
        )}

        {estado.kind === 'error' && (
          <p className="modal-error" role="alert">
            {estado.mensaje}
          </p>
        )}

        {estado.kind === 'ok' && actual && (
          <>
            {estado.data.articulos.length > 1 && (
              <div className="modal-chips" role="tablist" aria-label="Artículos">
                {estado.data.articulos.map((a, i) => (
                  <button
                    key={a.numero}
                    type="button"
                    role="tab"
                    aria-selected={i === sel}
                    className={`modal-chip${i === sel ? ' modal-chip-active' : ''}`}
                    onClick={() => setSel(i)}
                  >
                    Art. {a.numero}
                  </button>
                ))}
              </div>
            )}
            <h3 className="modal-art-titulo">{etiquetaArticulo(actual)}</h3>
            {actual.titulo && (
              <p className="modal-art-subtitulo">{actual.titulo}</p>
            )}
            <div className="modal-art-texto">
              {actual.texto.split(/\n{2,}/).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            {estado.data.noEncontrados.length > 0 && (
              <p className="modal-aviso">
                No disponibles en el corpus: art.{' '}
                {estado.data.noEncontrados.join(', art. ')}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Pastilla de cita legal. Si la cita referencia artículos concretos,
 * es un botón que abre el texto del artículo; si no, texto plano.
 */
export function CitaPill({ ley, articulo }: { ley: string; articulo: string }) {
  const [abierto, setAbierto] = useState(false);
  const refs = parseCita(articulo);
  if (!refs) {
    return (
      <span className="cita-pill">
        {ley} · {articulo}
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        className="cita-pill cita-pill-btn"
        onClick={() => setAbierto(true)}
        title="Ver el texto del artículo"
      >
        {ley} · {articulo}
      </button>
      {abierto && (
        <ArticuloModal
          ley={ley}
          articulo={articulo}
          onClose={() => setAbierto(false)}
        />
      )}
    </>
  );
}

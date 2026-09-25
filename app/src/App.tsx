import type { ReactElement } from 'react';
import { BottomNav, Header } from './components/ui';
import { RequireAuth } from './components/RequireAuth';
import { AuthProvider } from './lib/auth';
import { baseDeOpo, etiquetaEntidad, oposiciones, oposicionDe } from './lib/data';
import { link, useHashRoute } from './lib/router';
import type { OposicionId } from './types';
import TemasOpo from './views/oposicion/TemasOpo';
import EstudioTemaOpo from './views/oposicion/EstudioTemaOpo';
import TestConfigOpo from './views/oposicion/TestConfigOpo';
import TestRunOpo from './views/oposicion/TestRunOpo';
import TestResultOpo from './views/oposicion/TestResultOpo';
import RepasoOpo from './views/oposicion/RepasoOpo';
import TemasA2 from './views/a2/TemasA2';
import FichaTema from './views/a2/FichaTema';
import ListaTemario from './views/temario/ListaTemario';
import DetalleTema from './views/temario/DetalleTema';
import Oposiciones, { OpoCard } from './views/Oposiciones';
import Progreso from './views/Progreso';
import Login from './views/auth/Login';
import Register from './views/auth/Register';

const ORDEN_DIPUTACION = ['Huelva', 'Cádiz', 'Granada', 'Sevilla (OPAEF)', 'Canal Sur / RTVA'];

function Home() {
  const grupos = ORDEN_DIPUTACION.map((dip) => ({
    dip,
    opos: oposiciones.filter((o) => o.diputacion === dip),
  })).filter((g) => g.opos.length > 0);

  return (
    <div className="screen">
      <Header title="OposDipu" />
      <main className="container">
        <section className="hero">
          <img className="hero-logo" src="/logo.png" alt="Logo de OposDipu" />
          <p className="hero-title">OposDipu</p>
          <p className="hero-sub">
            Estudia las oposiciones públicas andaluzas: cuestionarios,
            temario desarrollado y seguimiento de tu progreso.
          </p>
        </section>
        {grupos.map((g) => (
          <section key={g.dip} aria-label={etiquetaEntidad(g.dip)}>
            <h2 className="temario-grupo">{etiquetaEntidad(g.dip)}</h2>
            <div className="opo-grid">
              {g.opos.map((o) => (
                <OpoCard key={o.id} opo={o} />
              ))}
            </div>
          </section>
        ))}
        <a className="home-link" href={link('/progreso')}>
          📊 Ver mi progreso
        </a>
      </main>
    </div>
  );
}

const publicRoutes: Record<string, () => ReactElement> = {
  '/login': Login,
  '/register': Register,
};

const OPOS_PREGUNTAS: OposicionId[] = ['HUE-C1', 'CAD-C2', 'GRA-C1', 'SEV-A1', 'CSUR-RED', 'CSUR-PRO', 'CSUR-AYP', 'CSUR-PPR'];

function vistasOpo(opoId: OposicionId): Record<string, () => ReactElement> {
  const base = baseDeOpo(opoId);
  return {
    [base]: () => <TemasOpo opoId={opoId} base={base} />,
    [`${base}/test`]: () => <TestConfigOpo opoId={opoId} base={base} />,
    [`${base}/test/run`]: () => <TestRunOpo opoId={opoId} base={base} />,
    [`${base}/test/fin`]: () => <TestResultOpo opoId={opoId} base={base} />,
    [`${base}/repaso`]: () => <RepasoOpo opoId={opoId} base={base} />,
    [`${base}/temario`]: () => <ListaTemario opoId={opoId} base={base} />,
  };
}

const routes: Record<string, () => ReactElement> = {
  '/': Home,
  '/oposiciones': Oposiciones,
  '/a2': TemasA2,
  '/a2/temario': () => <ListaTemario opoId="HUE-A2" base="/a2" />,
  '/progreso': Progreso,
  ...Object.fromEntries(OPOS_PREGUNTAS.flatMap((id) => Object.entries(vistasOpo(id)))),
};

function NotFound() {
  return (
    <div className="screen">
      <Header title="No encontrado" backTo="/" />
      <main className="container">
        <p className="placeholder">Esta pantalla no existe.</p>
      </main>
    </div>
  );
}

function resolveDynamic(path: string): () => ReactElement {
  const mOpoTema = path.match(/^\/opo\/([A-Za-z0-9-]+)\/tema\/([A-Za-z0-9]+)$/);
  if (mOpoTema) {
    try {
      const opo = oposicionDe(mOpoTema[1] as OposicionId);
      if (opo.formato === 'preguntas') {
        const opoId = opo.id;
        const base = baseDeOpo(opoId);
        const temaId = mOpoTema[2];
        return () => <EstudioTemaOpo opoId={opoId} base={base} temaId={temaId} />;
      }
    } catch {
      // Oposición desconocida: NotFound.
    }
  }
  const mC1 = path.match(/^\/c1\/tema\/([A-Za-z0-9]+)$/);
  if (mC1) {
    const temaId = mC1[1];
    return () => <EstudioTemaOpo opoId="HUE-C1" base="/c1" temaId={temaId} />;
  }
  const mA2 = path.match(/^\/a2\/tema\/([A-Za-z0-9]+)$/);
  if (mA2) {
    const temaId = mA2[1];
    return () => <FichaTema temaId={temaId} />;
  }
  const mOpoTemario = path.match(/^\/opo\/([A-Za-z0-9-]+)\/temario\/([A-Za-z0-9-]+)$/);
  if (mOpoTemario) {
    try {
      const opo = oposicionDe(mOpoTemario[1] as OposicionId);
      const opoId = opo.id;
      const base = baseDeOpo(opoId);
      const temaId = mOpoTemario[2];
      return () => <DetalleTema opoId={opoId} base={base} temaId={temaId} />;
    } catch {
      // Oposición desconocida: NotFound.
    }
  }
  const mT1 = path.match(/^\/c1\/temario\/([A-Za-z0-9-]+)$/);
  if (mT1) {
    const temaId = mT1[1];
    return () => <DetalleTema opoId="HUE-C1" base="/c1" temaId={temaId} />;
  }
  const mT2 = path.match(/^\/a2\/temario\/([A-Za-z0-9-]+)$/);
  if (mT2) {
    const temaId = mT2[1];
    return () => <DetalleTema opoId="HUE-A2" base="/a2" temaId={temaId} />;
  }
  return NotFound;
}

export default function App() {
  const path = useHashRoute();
  let screen: ReactElement;
  if (publicRoutes[path]) {
    const Screen = publicRoutes[path];
    screen = <Screen />;
  } else {
    const Screen = routes[path] ?? resolveDynamic(path);
    screen = (
      <RequireAuth>
        <Screen />
        <BottomNav />
      </RequireAuth>
    );
  }
  return <AuthProvider>{screen}</AuthProvider>;
}

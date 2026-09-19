import type { ReactElement } from 'react';
import { BottomNav, Header } from './components/ui';
import { RequireAuth } from './components/RequireAuth';
import { AuthProvider } from './lib/auth';
import { link, useHashRoute } from './lib/router';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import TemasC1 from './views/c1/TemasC1';
import EstudioTema from './views/c1/EstudioTema';
import TestConfig from './views/c1/TestConfig';
import TestRun from './views/c1/TestRun';
import TestResult from './views/c1/TestResult';
import Repaso from './views/c1/Repaso';
import TemasA2 from './views/a2/TemasA2';
import FichaTema from './views/a2/FichaTema';
import ListaTemario from './views/temario/ListaTemario';
import DetalleTema from './views/temario/DetalleTema';
import Progreso from './views/Progreso';

function Home() {
  return (
    <div className="screen">
      <Header title="OposDipu" />
      <main className="container">
        <section className="hero">
          <img className="hero-logo" src="/logo.png" alt="Logo de OposDipu" />
          <p className="hero-title">OposDipu</p>
          <p className="hero-sub">
            Estudia las oposiciones de la Diputación de Huelva: cuestionarios,
            fichas-esquema y seguimiento de tu progreso.
          </p>
        </section>
        <div className="home-grid">
          <a className="home-card home-card-c1" href={link('/c1')}>
            <h2>C1 — Administrativo</h2>
            <p>Administrativo — 40 temas, preguntas y respuestas</p>
          </a>
          <a className="home-card home-card-a2" href={link('/a2')}>
            <h2>A2 — Técnico Medio de Gestión</h2>
            <p>Técnico Medio de Gestión — 60 temas, fichas-esquema</p>
          </a>
        </div>
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

const routes: Record<string, () => ReactElement> = {
  '/': Home,
  '/c1': TemasC1,
  '/c1/test': TestConfig,
  '/c1/test/run': TestRun,
  '/c1/test/fin': TestResult,
  '/c1/repaso': Repaso,
  '/c1/temario': () => <ListaTemario perfil="c1" />,
  '/a2': TemasA2,
  '/a2/temario': () => <ListaTemario perfil="a2" />,
  '/progreso': Progreso,
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
  const mC1 = path.match(/^\/c1\/tema\/([A-Za-z0-9]+)$/);
  if (mC1) {
    const temaId = mC1[1];
    return () => <EstudioTema temaId={temaId} />;
  }
  const mA2 = path.match(/^\/a2\/tema\/([A-Za-z0-9]+)$/);
  if (mA2) {
    const temaId = mA2[1];
    return () => <FichaTema temaId={temaId} />;
  }
  const mT1 = path.match(/^\/c1\/temario\/([A-Za-z0-9-]+)$/);
  if (mT1) {
    const temaId = mT1[1];
    return () => <DetalleTema perfil="c1" temaId={temaId} />;
  }
  const mT2 = path.match(/^\/a2\/temario\/([A-Za-z0-9-]+)$/);
  if (mT2) {
    const temaId = mT2[1];
    return () => <DetalleTema perfil="a2" temaId={temaId} />;
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

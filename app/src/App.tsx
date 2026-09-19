import type { ReactElement } from 'react';
import { Header } from './components/ui';
import { link, useHashRoute } from './lib/router';
import TemasC1 from './views/c1/TemasC1';
import EstudioTema from './views/c1/EstudioTema';
import TestConfig from './views/c1/TestConfig';
import TestRun from './views/c1/TestRun';
import TestResult from './views/c1/TestResult';
import Repaso from './views/c1/Repaso';
import TemasA2 from './views/a2/TemasA2';
import FichaTema from './views/a2/FichaTema';
import Progreso from './views/Progreso';

function Home() {
  return (
    <div className="screen">
      <Header title="OposDipu" />
      <main className="container">
        <a className="home-card" href={link('/c1')}>
          <h2>C1 — Administrativo</h2>
          <p>Administrativo — 40 temas, preguntas y respuestas</p>
        </a>
        <a className="home-card" href={link('/a2')}>
          <h2>A2 — Técnico Medio de Gestión</h2>
          <p>Técnico Medio de Gestión — 60 temas, fichas-esquema</p>
        </a>
        <a className="home-link" href={link('/progreso')}>
          Ver mi progreso
        </a>
      </main>
    </div>
  );
}

const routes: Record<string, () => ReactElement> = {
  '/': Home,
  '/c1': TemasC1,
  '/c1/test': TestConfig,
  '/c1/test/run': TestRun,
  '/c1/test/fin': TestResult,
  '/c1/repaso': Repaso,
  '/a2': TemasA2,
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
  return NotFound;
}

export default function App() {
  const path = useHashRoute();
  const Screen = routes[path] ?? resolveDynamic(path);
  return <Screen />;
}

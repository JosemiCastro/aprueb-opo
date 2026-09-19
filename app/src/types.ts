export interface Question {
  id: string;
  perfil: string[];
  tema: string | number;
  ley: string;
  articulo: string;
  enunciado: string;
  respuesta: string;
  explicacion: string;
  verificado_corpus: boolean;
}

export interface PuntoClave {
  punto: string;
  ley: string;
  articulo: string;
  verificado_corpus?: boolean;
}

export interface Esquema {
  id: string;
  perfil: string[];
  tema: string | number;
  titulo: string;
  puntos_clave: PuntoClave[];
  checklist: string[];
}

export interface TemaMeta {
  id: string;
  perfil: 'c1' | 'a2';
  tipo: 'comun' | 'especifico';
  numero: string;
  titulo: string;
}

export interface QAStat {
  ok: number;
  ko: number;
  last: number;
}

export interface SessionRec {
  date: string;
  perfil: 'c1' | 'a2';
  modo: 'estudio' | 'test' | 'repaso' | 'ficha';
  temaId?: string;
  total: number;
  aciertos: number;
}

export interface ProgressState {
  qa: Record<string, QAStat>;
  sessions: SessionRec[];
  checks: Record<string, boolean[]>;
}

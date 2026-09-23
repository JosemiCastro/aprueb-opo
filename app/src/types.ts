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

// Oposición: cada convocatoria que cubre la app (Huelva + nuevas).
export type OposicionId = 'HUE-C1' | 'HUE-A2' | 'CAD-C2' | 'GRA-C1' | 'SEV-A1';

export type EstadoOposicion = 'plazo-abierto' | 'bases-publicadas' | 'pendiente-boe';

export interface Oposicion {
  id: OposicionId;
  diputacion: string;
  cuerpo: string;
  grupo: string;
  plazas: number;
  plazasDetalle: string;
  turno: string;
  sistema: string;
  estado: EstadoOposicion;
  bop: string;
  bopUrl?: string;
  boe?: string;
  boeUrl?: string;
  plazo?: string;
  /** 'preguntas': estudio por preguntas estilo C1; 'fichas': fichas-esquema estilo A2 */
  formato: 'preguntas' | 'fichas';
}

export interface TemaMeta {
  id: string;
  /** Grupo en minúsculas: 'c1' | 'a2' | 'c2' | 'a1' */
  perfil: string;
  tipo: 'comun' | 'especifico';
  numero: string;
  titulo: string;
  /** Oposición a la que pertenece. En las 100 de Huelva se deduce del perfil. */
  oposicion?: OposicionId;
}

// Temario desarrollado (app/src/data/{c1,a2}/temario/*.json)
export interface SeccionTema {
  titulo: string;
  texto: string;
}

export interface TemaDesarrollado {
  id: string;
  tema: string;
  tipo: 'comun' | 'especifico';
  numero: number;
  titulo: string;
  secciones: SeccionTema[];
  relacionados: string[];
}

export interface QAStat {
  ok: number;
  ko: number;
  last: number;
}

export interface SessionRec {
  date: string;
  /**
   * Oposición de la sesión. Las sesiones antiguas guardan 'c1'/'a2'
   * (Huelva); las nuevas guardan el OposicionId ('HUE-C1', 'CAD-C2'…).
   */
  perfil: string;
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

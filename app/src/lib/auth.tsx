import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export const TOKEN_KEY = 'oposdipu-token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // almacenamiento no disponible: se ignora
  }
}

export function logout(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // nada que hacer
  }
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (data && typeof data === 'object') {
      const msg = (data as Record<string, unknown>).error;
      if (typeof msg === 'string' && msg.length > 0) return msg;
    }
  } catch {
    // respuesta sin JSON legible
  }
  return fallback;
}

async function parseToken(res: Response): Promise<string> {
  const data: unknown = await res.json();
  const token =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>).token
      : undefined;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Respuesta inválida del servidor');
  }
  return token;
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Usuario o contraseña incorrectos');
    }
    throw new Error(await readError(res, 'No se pudo iniciar sesión'));
  }
  setToken(await parseToken(res));
}

export async function register(
  username: string,
  password: string,
): Promise<void> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    if (res.status === 409) {
      throw new Error('Ese nombre de usuario ya está en uso');
    }
    throw new Error(await readError(res, 'No se pudo crear la cuenta'));
  }
  setToken(await parseToken(res));
}

export function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(path, { ...init, headers });
}

export async function me(): Promise<{ username: string }> {
  const res = await authFetch('/api/auth/me');
  if (!res.ok) {
    throw new Error('Sesión no válida');
  }
  const data: unknown = await res.json();
  const username =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>).username
      : undefined;
  if (typeof username !== 'string') {
    throw new Error('Respuesta inválida del servidor');
  }
  return { username };
}

interface AuthContextValue {
  user: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Las funciones login()/register()/logout() de arriba hablan con la API;
// el proveedor las envuelve para mantener el estado de React sincronizado.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await me();
      setUser(data.username);
    } catch {
      logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Si se cierra sesión en otra pestaña, reflejarlo aquí también.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) void refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const signIn = useCallback(
    async (username: string, password: string) => {
      await login(username, password);
      await refresh();
    },
    [refresh],
  );

  const signUp = useCallback(
    async (username: string, password: string) => {
      await register(username, password);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(() => {
    logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: signIn,
        register: signUp,
        logout: signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

import { useState } from 'react';
import type { FormEvent } from 'react';
import { login } from '../../lib/auth';
import { link, navigate } from '../../lib/router';
import { Btn } from '../../components/ui';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const name = username.trim();
    if (name.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setBusy(true);
    try {
      await login(name, password);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo iniciar sesión.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <div className="container">
        <form className="auth-card" onSubmit={onSubmit} noValidate>
          <img className="auth-logo" src="/logo.png" alt="OposDipu" />
          <h1 className="auth-title">Entrar</h1>
          {error ? (
            <p className="auth-error" role="alert">
              {error}
            </p>
          ) : null}
          <label>
            Usuario
            <input
              className="input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
            />
          </label>
          <label>
            Contraseña
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={6}
            />
          </label>
          <Btn type="submit" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </Btn>
          <p className="auth-switch">
            ¿No tienes cuenta?{' '}
            <a href={link('/register')}>Crear cuenta</a>
          </p>
        </form>
      </div>
    </div>
  );
}

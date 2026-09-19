import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../lib/auth';
import { link, navigate } from '../../lib/router';
import { Btn } from '../../components/ui';

export default function Register() {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setBusy(true);
    try {
      await register(name, password);
      navigate('/');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo crear la cuenta.',
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
          <h1 className="auth-title">Crear cuenta</h1>
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
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <label>
            Repetir contraseña
            <input
              className="input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={6}
            />
          </label>
          <Btn type="submit" disabled={busy}>
            {busy ? 'Creando…' : 'Crear cuenta'}
          </Btn>
          <p className="auth-switch">
            ¿Ya tienes cuenta? <a href={link('/login')}>Entrar</a>
          </p>
        </form>
      </div>
    </div>
  );
}

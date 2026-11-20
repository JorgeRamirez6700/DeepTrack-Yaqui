import { useState } from 'react';
import { api } from '../services/api.js';
import { ThemeSelector } from './ThemeProvider.jsx';

export default function LoginForm({ onLogin }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña para continuar.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const u = await api.login(usuario.trim(), password);
      onLogin(u);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <aside className="login-hero">
        <svg viewBox="0 0 500 700" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0,120 C120,180 200,60 320,110 C400,145 460,90 500,130 L500,0 L0,0 Z" fill="#1B4552" />
          <path d="M0,260 C130,320 210,200 340,250 C420,285 470,230 500,260" stroke="#2E6E7E" strokeWidth="2" fill="none" opacity="0.7" />
          <path d="M0,340 C130,395 220,290 340,330 C420,360 470,315 500,340" stroke="#2E6E7E" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M0,420 C130,470 220,375 340,410 C420,435 470,400 500,420" stroke="#2E6E7E" strokeWidth="2" fill="none" opacity="0.35" />
          <path d="M0,700 C120,640 200,660 320,690 C400,700 460,680 500,700 L500,700 L0,700 Z" fill="#0D262E" />
        </svg>
        <div className="brand-mark">DEEPTRACK YAQUI</div>
        <div className="hero-copy">
          <h1>Profundidad de pozos del Valle del Yaqui, en un solo lugar.</h1>
          <p>
            Consulta la ubicación de cada sonda, su lectura más reciente y su tendencia histórica,
            sin depender de hojas de cálculo.
          </p>
        </div>
        <div className="hero-foot">Distrito de Riego — Módulo de monitoreo hídrico</div>
      </aside>

      <main className="login-form-wrap">
        <div className="login-theme"><ThemeSelector compact /></div>
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Iniciar sesión</h2>
          <p className="sub">Ingresa con tu cuenta institucional.</p>

          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label htmlFor="usuario">Usuario</label>
            <input id="usuario" value={usuario} onChange={(e) => setUsuario(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verificando…' : 'Iniciar sesión'}
          </button>

          {import.meta.env.DEV && (
            <p className="login-hint">
              Desarrollo (datos semilla): <code>admin</code> / <code>admin123</code>
            </p>
          )}
        </form>
      </main>
    </div>
  );
}

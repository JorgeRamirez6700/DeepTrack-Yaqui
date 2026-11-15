import { useEffect, useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import Dashboard from './components/Dashboard.jsx';
import { api } from './services/api.js';

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    api.me().then((u) => {
      if (active) setUser(u);
    }).catch(() => {
      if (active) setUser(null);
    }).finally(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, []);

  const handleLogout = async () => {
    try {
      await api.logout();
      setUser(null);
    } catch (err) {
      window.alert(`No se pudo cerrar sesión: ${err.message}`);
    }
  };

  if (checking) return <div className="login-screen"><main className="login-form-wrap">Verificando sesión…</main></div>;
  return user
    ? <Dashboard user={user} onLogout={handleLogout} />
    : <LoginForm onLogin={setUser} />;
}

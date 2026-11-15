import { useState } from 'react';
import LoginForm from './components/LoginForm.jsx';
import Dashboard from './components/Dashboard.jsx';

const SESSION_KEY = 'deeptrack_user';

function readSession() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(readSession);

  const handleLogin = (u) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginForm onLogin={handleLogin} />;
}

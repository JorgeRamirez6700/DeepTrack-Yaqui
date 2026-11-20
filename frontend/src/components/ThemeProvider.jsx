import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'deeptrack-appearance';
const ThemeContext = createContext(null);
const choices = ['light', 'dark', 'system'];

function initialMode() {
  try {
    const saved = localStorage.getItem(KEY);
    return choices.includes(saved) ? saved : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(initialMode);
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches);
  const theme = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  const changeMode = (next) => {
    if (!choices.includes(next)) return;
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch { /* privacidad del navegador */ }
  };

  return (
    <ThemeContext.Provider value={{ mode, theme, changeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme necesita ThemeProvider');
  return value;
}

export function ThemeSelector({ compact = false }) {
  const { mode, theme, changeMode } = useTheme();
  if (compact) {
    return (
      <button type="button" className="theme-toggle"
        aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        onClick={() => changeMode(theme === 'dark' ? 'light' : 'dark')}>
        <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
      </button>
    );
  }
  return (
    <fieldset className="theme-picker">
      <legend>Apariencia</legend>
      <div className="theme-options" role="group" aria-label="Elegir tema">
        {[['light', '☀', 'Claro'], ['dark', '☾', 'Oscuro'], ['system', '◐', 'Sistema']].map(
          ([value, symbol, label]) => (
            <button key={value} type="button" aria-pressed={mode === value}
              className={mode === value ? 'theme-option selected' : 'theme-option'}
              onClick={() => changeMode(value)}>
              <span aria-hidden="true">{symbol}</span> {label}
            </button>
          )
        )}
      </div>
      <p className="theme-help">La selección se conserva en este navegador. Sistema sigue la apariencia de tu dispositivo.</p>
    </fieldset>
  );
}

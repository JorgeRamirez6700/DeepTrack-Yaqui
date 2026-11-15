import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';
import MapView from './MapView.jsx';
import SondaPanel from './SondaPanel.jsx';
import SondaForm from './SondaForm.jsx';
import TrendModal from './TrendModal.jsx';

export default function Dashboard({ user, onLogout }) {
  const [sondas, setSondas] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [formState, setFormState] = useState(null); // null = cerrado | { sonda } = abierto (sonda null = nueva)
  const [trendSonda, setTrendSonda] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setSondas(await api.listarSondas());
      setLoadError('');
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleSave = async (data, editingId) => {
    if (editingId) await api.actualizarSonda(editingId, data);
    else await api.crearSonda(data);
    setFormState(null);
    await cargar();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`¿Eliminar la sonda ${id}?`)) return;
    await api.eliminarSonda(id);
    setFormState(null);
    await cargar();
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="title">
          DeepTrack Yaqui <span className="role-pill">{user.rol}</span>
        </div>
        <div className="actions">
          <span>{user.nombreCompleto || user.usuario}</span>
          <button className="link-btn" onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      {loadError && (
        <div className="error-msg banner">
          No se pudieron cargar las sondas: {loadError}. ¿Está corriendo el backend?
        </div>
      )}

      <div className="dash-body">
        <MapView sondas={sondas} onSelect={setTrendSonda} />
        <SondaPanel
          sondas={sondas}
          onNew={() => setFormState({ sonda: null })}
          onEdit={(s) => setFormState({ sonda: s })}
          onDelete={handleDelete}
          onTrend={setTrendSonda}
        />
      </div>

      {formState && (
        <SondaForm
          sonda={formState.sonda}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setFormState(null)}
        />
      )}
      {trendSonda && <TrendModal sonda={trendSonda} onClose={() => setTrendSonda(null)} />}
    </div>
  );
}

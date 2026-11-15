import { useState } from 'react';

export default function SondaForm({ sonda, onSave, onDelete, onClose }) {
  const editing = Boolean(sonda);
  const [form, setForm] = useState({
    idSonda: sonda?.idSonda ?? '',
    cuadrante: sonda?.cuadrante ?? '',
    estado: sonda?.estado ?? 'ACTIVA',
    latitud: sonda?.latitud ?? '',
    longitud: sonda?.longitud ?? '',
    profundidadActual: sonda?.profundidadActual ?? '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave(
        {
          idSonda: form.idSonda.trim(),
          cuadrante: form.cuadrante.trim(),
          estado: form.estado,
          latitud: parseFloat(form.latitud),
          longitud: parseFloat(form.longitud),
          profundidadActual: form.profundidadActual === '' ? null : parseFloat(form.profundidadActual),
        },
        editing ? sonda.idSonda : null
      );
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal narrow">
        <div className="modal-head">
          <h3>{editing ? 'Editar sonda' : 'Nueva sonda'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label htmlFor="s-id">ID de sonda</label>
            <input id="s-id" value={form.idSonda} onChange={set('idSonda')} disabled={editing} placeholder="SN-YQ-120" />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-cuadrante">Cuadrante</label>
              <input id="s-cuadrante" value={form.cuadrante} onChange={set('cuadrante')} placeholder="B2" />
            </div>
            <div className="field">
              <label htmlFor="s-estado">Estado</label>
              <select id="s-estado" value={form.estado} onChange={set('estado')}>
                <option>ACTIVA</option>
                <option>INACTIVA</option>
                <option>MANTENIMIENTO</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-lat">Latitud</label>
              <input id="s-lat" type="number" step="any" value={form.latitud} onChange={set('latitud')} placeholder="27.35" />
            </div>
            <div className="field">
              <label htmlFor="s-lng">Longitud</label>
              <input id="s-lng" type="number" step="any" value={form.longitud} onChange={set('longitud')} placeholder="-109.95" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-prof">Profundidad actual (m)</label>
            <input id="s-prof" type="number" step="0.1" value={form.profundidadActual} onChange={set('profundidadActual')} placeholder="12.4" />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar sonda'}
            </button>
          </div>

          {editing && (
            <button type="button" className="delete-link" onClick={() => onDelete(sonda.idSonda)}>
              Eliminar esta sonda
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

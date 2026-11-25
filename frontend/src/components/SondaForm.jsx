import { useDialog } from './useDialog.js';
import { useRef, useState } from 'react';
import { lecturaOpcional } from '../utils/lecturaOpcional.js';

export default function SondaForm({ sonda, onSave, onDelete, onClose }) {
  const editing = Boolean(sonda);
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [form, setForm] = useState({
    idSonda: sonda?.idSonda ?? '',
    cuadrante: sonda?.cuadrante ?? '',
    estado: sonda?.estado ?? 'ACTIVA',
    latitud: sonda?.latitud ?? '',
    longitud: sonda?.longitud ?? '',
    profundidadActual: sonda?.estado === 'ACTIVA' ? (sonda.profundidadActual ?? '') : '',
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
          profundidadActual: lecturaOpcional(form.estado, form.profundidadActual),
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
      <div ref={dialogRef} className="modal narrow" role="dialog" aria-modal="true" aria-labelledby="form-title" tabIndex={-1}>
        <div className="modal-head">
          <h3 id="form-title">{editing ? 'Editar sonda' : 'Nueva sonda'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label htmlFor="s-id">ID de sonda</label>
            <input id="s-id" required maxLength={20} value={form.idSonda} onChange={set('idSonda')} disabled={editing} placeholder="SN-YQ-120" />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-cuadrante">Cuadrante</label>
              <input id="s-cuadrante" required maxLength={10} value={form.cuadrante} onChange={set('cuadrante')} placeholder="B2" />
            </div>
            <div className="field">
              <label htmlFor="s-estado">Estado</label>
              <select id="s-estado" value={form.estado} onChange={set('estado')}>
                <option>ACTIVA</option>
                <option>INACTIVA</option>
                <option>MANTENIMIENTO</option>
                <option>RETIRADA</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="s-lat">Latitud</label>
              <input id="s-lat" required min={-90} max={90} type="number" step="any" value={form.latitud} onChange={set('latitud')} placeholder="27.35" />
            </div>
            <div className="field">
              <label htmlFor="s-lng">Longitud</label>
              <input id="s-lng" required min={-180} max={180} type="number" step="any" value={form.longitud} onChange={set('longitud')} placeholder="-109.95" />
            </div>
          </div>
          <div className="field">
            <label htmlFor="s-prof">Lectura actual (m, valor firmado)</label>
            <input id="s-prof" disabled={form.estado !== 'ACTIVA'} type="number" step="any" value={form.profundidadActual} onChange={set('profundidadActual')} placeholder="Ej. 12.4 o -2.3" />
            <small>El signo depende de la referencia de medición acordada. Usa negativos solo si tu sonda reporta un nivel relativo firmado.</small>
          </div>

          {form.estado !== 'ACTIVA' && <p className="users-note">Las sondas no activas conservan sus lecturas, pero no admiten nuevas mediciones. Para reactivar una sonda retirada selecciona ACTIVA y guarda.</p>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar sonda'}
            </button>
          </div>

          {editing && sonda.estado !== 'RETIRADA' && (
            <button type="button" className="delete-link" onClick={() => onDelete(sonda.idSonda)}>
              Retirar esta sonda (conservar historial)
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

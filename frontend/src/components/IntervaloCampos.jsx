import { fechaLocal } from '../utils/intervaloAnalisis.js';

export default function IntervaloCampos({ valor, onChange, disabled = false }) {
  return (
    <div className="analysis-dates">
      <label>Desde
        <input aria-label="Desde" type="date" min="2000-01-01" max={valor.hasta || fechaLocal()} value={valor.desde}
          disabled={disabled} onChange={e => onChange({ ...valor, desde: e.target.value })} required />
      </label>
      <label>Hasta
        <input aria-label="Hasta" type="date" min={valor.desde || '2000-01-01'} max={fechaLocal()} value={valor.hasta}
          disabled={disabled} onChange={e => onChange({ ...valor, hasta: e.target.value })} required />
      </label>
    </div>
  );
}

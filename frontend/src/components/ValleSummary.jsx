import { useEffect, useState } from 'react';
import { api } from '../services/api.js';

const RANGOS = [
  { id: 'dia', label: 'Hoy' },
  { id: 'semana', label: 'Esta semana' },
  { id: 'mes', label: 'Este mes' },
];

const fmt = (n) => n == null ? 'Sin datos' : `${n.toFixed(2)} m`;

export default function ValleSummary() {
  const [periodo, setPeriodo] = useState('mes');
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    api.resumenValle(periodo)
      .then((res) => { if (activo) setResumen(res); })
      .catch((err) => { if (activo) { setError(err.message); setResumen(null); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [periodo]);

  return (
    <section className="valle-summary" aria-label="Resumen estadístico del Valle del Yaqui">
      <div className="valle-summary-head">
        <div>
          <h2>Resumen del Valle del Yaqui</h2>
          <p>Promedios descriptivos de las sondas activas, con datos de prueba.</p>
        </div>
        <div className="range-group" role="group" aria-label="Periodo del resumen">
          {RANGOS.map((r) => (
            <button key={r.id} type="button"
              className={`range-btn ${periodo === r.id ? 'active' : ''}`}
              aria-pressed={periodo === r.id}
              onClick={() => setPeriodo(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>
      {cargando && <p role="status">Cargando estadísticas…</p>}
      {!cargando && error && <p className="error-msg" role="alert">{error}</p>}
      {!cargando && resumen && (
        <>
          <div className="valle-cards">
            <div><small>Profundidad media por sonda</small><strong>{fmt(resumen.profundidadMediaM)}</strong></div>
            <div><small>Sondas con datos</small><strong>{resumen.sondasConDatos} / {resumen.sondasActivas}</strong></div>
            <div><small>Lecturas del periodo</small><strong>{resumen.lecturas}</strong></div>
            <div><small>Menor / mayor media por sonda</small><strong>{fmt(resumen.minimaMediaPorSondaM)} / {fmt(resumen.maximaMediaPorSondaM)}</strong></div>
          </div>
          <p className="valle-nota">Del {resumen.desde} al {resumen.hasta}. Se calcula una media por sonda y después una media entre las sondas con datos. No equivale al nivel general del acuífero.</p>
        </>
      )}
    </section>
  );
}

import { useDialog } from './useDialog.js';
import { useEffect, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api.js';
import { useTheme } from './ThemeProvider.jsx';

const RANGOS = [
  { id: 'dia', label: 'Último día' },
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: '6meses', label: 'Últimos 6 meses' },
  { id: 'anio', label: 'Último año' },
];

const fmtFecha = (iso, rango) => {
  const opciones = rango === 'dia'
    ? { hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short' };
  return new Date(iso).toLocaleString('es-MX', opciones);
};

export default function TrendModal({ sonda, onClose }) {
  const { theme } = useTheme();
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [rango, setRango] = useState('mes');
  const [datos, setDatos] = useState([]);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error

  useEffect(() => {
    let cancelado = false;
    setEstado('cargando');
    api
      .historico(sonda.idSonda, rango)
      .then((d) => {
        if (!cancelado) {
          setDatos(d.map((p) => ({ ...p, etiqueta: fmtFecha(p.fechaHora, rango) })));
          setEstado('ok');
        }
      })
      .catch(() => !cancelado && setEstado('error')); // flujo alternativo B del SRS
    return () => {
      cancelado = true;
    };
  }, [sonda.idSonda, rango]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="trend-title" tabIndex={-1}>
        <div className="modal-head">
          <div>
            <h3 id="trend-title">Sonda {sonda.idSonda}</h3>
            <div className="cuadrante">
              Cuadrante {sonda.cuadrante} — última lectura: {sonda.profundidadActual ?? '—'} m
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="range-group">
          {RANGOS.map((r) => (
            <button key={r.id} className={`range-btn ${rango === r.id ? 'active' : ''}`} aria-pressed={rango === r.id} onClick={() => setRango(r.id)}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="chart-box">
          {estado === 'cargando' && <div className="chart-empty">Cargando…</div>}
          {estado === 'error' && (
            <div className="chart-empty">
              Datos no disponibles temporalmente.<br />No se pudo obtener el histórico de la sonda.
            </div>
          )}
          {estado === 'ok' && datos.length === 0 && (
            <div className="chart-empty">Sin lecturas en el periodo seleccionado.</div>
          )}
          {estado === 'ok' && datos.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid stroke={theme === 'dark' ? '#40505c' : '#E3EBE6'} vertical={false} />
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11, fill: theme === 'dark' ? '#adbdc5' : '#637881' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} unit=" m" />
                <Tooltip formatter={(v) => [`${v} m`, 'Lectura']} labelFormatter={(l) => l} />
                <Line type="monotone" dataKey="profundidadM" stroke={theme === 'dark' ? '#7ec5cd' : '#2E6E7E'} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

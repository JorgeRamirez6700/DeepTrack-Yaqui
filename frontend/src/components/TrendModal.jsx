import { useDialog } from './useDialog.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api.js';
import { useTheme } from './ThemeProvider.jsx';
import { etiquetaVigencia, fechaRegistrada, metros, prepararHistorico, resumenHistorico } from '../utils/monitoreoSonda.js';

const RANGOS = [
  { id: 'dia', label: 'Último día' },
  { id: 'semana', label: 'Última semana' },
  { id: 'mes', label: 'Último mes' },
  { id: '6meses', label: 'Últimos 6 meses' },
  { id: 'anio', label: 'Último año' },
];

function etiquetaEje(t, rango) {
  const fecha = new Date(t);
  return fecha.toLocaleString('es-MX', rango === 'dia'
    ? { timeZone: 'UTC', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { timeZone: 'UTC', day: '2-digit', month: 'short', ...(rango === 'anio' ? { year: '2-digit' } : {}) });
}

export default function TrendModal({ sonda, onClose, revision = 0 }) {
  const { theme } = useTheme();
  const dialogRef = useRef(null);
  useDialog(dialogRef, onClose);
  const [rango, setRango] = useState('mes');
  const [resultado, setResultado] = useState(null);
  const id = sonda.idSonda;
  const vigente = resultado?.id === id && resultado?.rango === rango && resultado?.revision === revision;
  const estado = vigente ? resultado.estado : 'cargando';
  const datos = useMemo(() => vigente ? resultado.datos : [], [vigente, resultado]);
  const resumen = useMemo(() => resumenHistorico(datos), [datos]);

  useEffect(() => {
    let activo = true;
    api.historico(id, rango)
      .then(d => {
        if (activo) setResultado({ id, rango, revision, estado: 'ok', datos: prepararHistorico(d) });
      })
      .catch(() => {
        if (activo) setResultado({ id, rango, revision, estado: 'error', datos: [] });
      });
    return () => { activo = false; };
  }, [id, rango, revision]);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div ref={dialogRef} className="modal trend-detail" role="dialog" aria-modal="true" aria-labelledby="trend-title" tabIndex={-1}>
        <div className="modal-head">
          <div>
            <h3 id="trend-title">Sonda {id}</h3>
            <div className="cuadrante">Cuadrante {sonda.cuadrante} · {sonda.estado}</div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <section className="trend-current" aria-label="Última medición">
          <div><small>Última lectura</small><strong>{metros(sonda.profundidadActual)}</strong></div>
          <div><small>Fecha y hora registrada</small><strong>{fechaRegistrada(sonda.ultimaLecturaFechaHora)}</strong></div>
          <div><small>Vigencia al consultar</small><strong className={['ATRASADA', 'FECHA_FUTURA'].includes(sonda.vigenciaLectura) ? 'vigencia-aviso' : ''}>{etiquetaVigencia(sonda)}</strong></div>
        </section>

        <div className="range-group" role="group" aria-label="Periodo histórico">
          {RANGOS.map(r => (
            <button key={r.id} className={`range-btn ${rango === r.id ? 'active' : ''}`} aria-pressed={rango === r.id} onClick={() => setRango(r.id)}>
              {r.label}
            </button>
          ))}
        </div>

        {estado === 'ok' && resumen.cantidad > 0 && (
          <section className="trend-metrics" aria-label="Indicadores del periodo">
            <div><small>Lecturas válidas</small><strong>{resumen.cantidad}</strong></div>
            <div><small>Mínima</small><strong>{metros(resumen.minimo)}</strong></div>
            <div><small>Promedio</small><strong>{metros(resumen.promedio)}</strong></div>
            <div><small>Máxima</small><strong>{metros(resumen.maximo)}</strong></div>
            <div><small>Variación (última − primera)</small><strong>{metros(resumen.variacion, true)}</strong></div>
          </section>
        )}

        <div className="chart-box">
          {estado === 'cargando' && <div className="chart-empty" role="status">Cargando…</div>}
          {estado === 'error' && (
            <div className="chart-empty" role="alert">
              Datos no disponibles temporalmente.<br />No se pudo obtener el histórico de la sonda.
            </div>
          )}
          {estado === 'ok' && resumen.cantidad === 0 && (
            <div className="chart-empty">Sin lecturas válidas en el periodo seleccionado.</div>
          )}
          {estado === 'ok' && resumen.cantidad > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 8, right: 18, bottom: 4, left: 0 }}>
                <CartesianGrid stroke={theme === 'dark' ? '#40505c' : '#E3EBE6'} vertical={false} />
                <XAxis type="number" dataKey="tiempo" scale="time" domain={['dataMin', 'dataMax']}
                  tickFormatter={t => etiquetaEje(t, rango)} tick={{ fontSize: 11, fill: theme === 'dark' ? '#adbdc5' : '#637881' }} minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} unit=" m" domain={['auto', 'auto']} />
                <Tooltip formatter={v => [metros(v), 'Lectura']}
                  labelFormatter={t => new Date(t).toISOString().slice(0, 19).replace('T', ' ')} />
                <Line type="linear" dataKey="profundidadM" stroke={theme === 'dark' ? '#7ec5cd' : '#2E6E7E'}
                  strokeWidth={2.5} dot={resumen.cantidad === 1} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="trend-note">Indicadores descriptivos de las mediciones válidas del periodo. La variación conserva el signo; no es una predicción. Hora registrada sin zona horaria definida. Vigencia no equivale a conectividad.</p>
      </div>
    </div>
  );
}

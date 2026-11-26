import { useDialog } from './useDialog.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api.js';
import { useTheme } from './ThemeProvider.jsx';
import IntervaloCampos from './IntervaloCampos.jsx';
import { intervaloInicial, validarIntervalo } from '../utils/intervaloAnalisis.js';
import { etiquetaVigencia, fechaRegistrada, metros, prepararHistorico, resumenHistorico } from '../utils/monitoreoSonda.js';

import { RANGOS_SONDA as RANGOS, crearReporteSonda, descargarBlob } from '../utils/reporteSonda.js';

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
  const [fechas, setFechas] = useState(intervaloInicial);
  const [intervalo, setIntervalo] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [exportando, setExportando] = useState('');
  const [errorExportacion, setErrorExportacion] = useState('');
  const bloqueoExportacion = useRef(false);
  const id = sonda.idSonda;
  const vigente = resultado?.id === id && resultado?.rango === rango && resultado?.revision === revision && resultado?.intervalo === intervalo;
  const estado = vigente ? resultado.estado : 'cargando';
  const datos = useMemo(() => vigente ? resultado.datos : [], [vigente, resultado]);
  const resumen = useMemo(() => resumenHistorico(datos), [datos]);

  useEffect(() => {
    let activo = true;
    (rango === 'personalizado' ? api.historicoIntervalo(id, intervalo) : api.historico(id, rango))
      .then(d => {
        if (activo) setResultado({ id, rango, revision, intervalo, estado: 'ok', datos: prepararHistorico(d) });
      })
      .catch(() => {
        if (activo) setResultado({ id, rango, revision, intervalo, estado: 'error', datos: [] });
      });
    return () => { activo = false; };
  }, [id, rango, revision, intervalo]);

  const cambiarRango = nuevo => {
    if (nuevo === rango) return;
    setResultado(null);
    setErrorExportacion('');
    setIntervalo(null);
    setRango(nuevo);
  };
  const puedeExportar = estado === 'ok' && resumen.cantidad > 0 && !exportando;

  async function exportar(formato) {
    if (!puedeExportar || bloqueoExportacion.current) return;
    bloqueoExportacion.current = true;
    setExportando(formato);
    setErrorExportacion('');
    try {
      const reporte = crearReporteSonda(sonda, rango, datos, new Date(), intervalo);
      const blob = formato === 'pdf'
        ? (await import('../utils/exportarPdfSonda.js')).generarPdfSonda(reporte)
        : await (await import('../utils/exportarExcelSonda.js')).generarExcelSonda(reporte);
      descargarBlob(blob, reporte.nombre + (formato === 'pdf' ? '.pdf' : '.xlsx'));
    } catch {
      setErrorExportacion('No se pudo generar el archivo. Intenta nuevamente.');
    } finally {
      bloqueoExportacion.current = false;
      setExportando('');
    }
  }

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
            <button key={r.id} className={`range-btn ${rango === r.id ? 'active' : ''}`} aria-pressed={rango === r.id} disabled={Boolean(exportando)} onClick={() => cambiarRango(r.id)}>
              {r.label}
            </button>
          ))}
        </div>

        <form className="trend-custom" onSubmit={e => {
          e.preventDefault();
          if (validarIntervalo(fechas) || exportando) return;
          setResultado(null); setErrorExportacion(''); setIntervalo({ ...fechas }); setRango('personalizado');
        }}>
          <IntervaloCampos valor={fechas} onChange={setFechas} disabled={Boolean(exportando)} />
          <button type="submit" className="btn-small" disabled={Boolean(exportando) || Boolean(validarIntervalo(fechas))}>Aplicar fechas</button>
          {validarIntervalo(fechas) && <small role="alert">{validarIntervalo(fechas)}</small>}
        </form>
        {rango === 'personalizado' && intervalo && <p className="valle-nota">Periodo aplicado: {intervalo.desde} a {intervalo.hasta}</p>}

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
        <div className="trend-export" role="group" aria-label="Exportación individual">
          <button type="button" className="btn-small" disabled={!puedeExportar} onClick={() => exportar('pdf')}>
            {exportando === 'pdf' ? 'Generando PDF…' : 'Exportar PDF'}
          </button>
          <button type="button" className="btn-small" disabled={!puedeExportar} onClick={() => exportar('xlsx')}>
            {exportando === 'xlsx' ? 'Generando Excel…' : 'Exportar Excel'}
          </button>
          <small>{exportando ? 'Preparando archivo del periodo seleccionado…' : resumen.cantidad > 0 && estado === 'ok' ? 'El archivo conserva los datos del periodo mostrado.' : 'Disponible cuando existan lecturas válidas.'}</small>
        </div>
        {errorExportacion && <div className="error-msg" role="alert">{errorExportacion}</div>}
        <p className="trend-note">Indicadores descriptivos de las mediciones válidas del periodo. La variación conserva el signo; no es una predicción. Hora registrada sin zona horaria definida. Vigencia no equivale a conectividad.</p>
      </div>
    </div>
  );
}

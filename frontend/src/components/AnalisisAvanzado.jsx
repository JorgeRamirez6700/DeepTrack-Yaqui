import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../services/api.js';
import { metros } from '../utils/monitoreoSonda.js';
import { intervaloInicial, puntosComparacion, validarIntervalo } from '../utils/intervaloAnalisis.js';
import IntervaloCampos from './IntervaloCampos.jsx';
import { useTheme } from './ThemeProvider.jsx';

const COLORES = ['#2e8297', '#b96a36', '#7582c6', '#538b61', '#a76d99'];

export default function AnalisisAvanzado({ sondas, revision }) {
  const { theme } = useTheme();
  const [fechas, setFechas] = useState(intervaloInicial);
  const [ids, setIds] = useState([]);
  const [solicitud, setSolicitud] = useState(() => ({ fechas: intervaloInicial(), ids: [] }));
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [consulta, setConsulta] = useState(null);
  const vigente = consulta?.solicitud === solicitud && consulta?.revision === revision;
  const datos = vigente ? resultado : null;
  const cargando = !vigente;
  const puntos = useMemo(() => puntosComparacion(datos?.series ?? []), [datos]);
  const hayComparacion = datos?.series.some(s => s.dias.some(d => d.lecturas > 0));
  const hayCuadrantes = datos?.cuadrantes.some(q => q.sondasConDatos > 0);
  const grid = theme === 'dark' ? '#40505c' : '#dfe9e5';

  useEffect(() => {
    let activo = true;
    api.analisis(solicitud.fechas, solicitud.ids)
      .then(d => {
        if (activo) { setResultado(d); setError(''); setConsulta({ solicitud, revision }); }
      })
      .catch(e => {
        if (activo) { setResultado(null); setError(e.message); setConsulta({ solicitud, revision }); }
      });
    return () => { activo = false; };
  }, [solicitud, revision]);

  function aplicar(e) {
    e.preventDefault();
    if (validarIntervalo(fechas)) return;
    setSolicitud({ fechas: { ...fechas }, ids: [...ids] });
  }
  const errorFechas = validarIntervalo(fechas);
  return (
    <section className="valle-reports analysis-panel" aria-label="Análisis avanzado">
      <div className="report-header"><div><h2>Análisis avanzado</h2><p>Compara mediciones y cobertura por cuadrante durante un mismo periodo.</p></div></div>
      <form onSubmit={aplicar} className="analysis-controls">
        <IntervaloCampos valor={fechas} onChange={setFechas} />
        <fieldset className="analysis-probes">
          <legend>Selecciona hasta cinco sondas para comparar</legend>
          {sondas.length === 0 && <p>No hay sondas disponibles.</p>}
          {[...sondas].sort((a,b) => a.idSonda.localeCompare(b.idSonda)).map(s => (
            <label key={s.idSonda}>
              <input type="checkbox" checked={ids.includes(s.idSonda)}
                disabled={!ids.includes(s.idSonda) && ids.length >= 5}
                onChange={e => setIds(prev => e.target.checked ? [...prev, s.idSonda] : prev.filter(id => id !== s.idSonda))} />
              {s.idSonda} · {s.cuadrante} · {s.estado}
            </label>
          ))}
        </fieldset>
        {errorFechas && <p className="error-msg" role="alert">{errorFechas}</p>}
        <button className="btn-small" type="submit" disabled={Boolean(errorFechas)}>Aplicar análisis</button>
      </form>
      {cargando && <p role="status">Cargando análisis…</p>}
      {!cargando && error && <p role="alert" className="error-msg">{error}</p>}
      {datos && <>
        <p className="valle-nota">Periodo consultado: {datos.desde} a {datos.hasta} (inclusive; hasta el momento de consulta).</p>
        <section aria-label="Comparación entre sondas">
          <h3>Comparación entre sondas</h3>
          {datos.series.length === 0 ? <p>Selecciona las sondas y aplica el análisis.</p> :
            !hayComparacion ? <p>Sin lecturas válidas de las sondas seleccionadas.</p> :
            <div className="report-chart-box analysis-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={puntos} margin={{ top: 12, right: 20, bottom: 8, left: 8 }}>
                  <CartesianGrid stroke={grid} vertical={false} />
                  <XAxis dataKey="fecha" tick={{fontSize: 11}} minTickGap={24} />
                  <YAxis unit=" m" domain={['auto','auto']} tick={{fontSize: 11}} />
                  <Tooltip formatter={(v, nombre) => [metros(v), nombre]} />
                  <Legend />
                  {datos.series.map((s,i) => <Line key={s.idSonda} dataKey={'s'+i} name={s.idSonda}
                    stroke={COLORES[i]} type="linear" strokeWidth={2} dot={{r: 2}} connectNulls={false} />)}
                </LineChart>
              </ResponsiveContainer>
            </div>}
          <div className="report-table-wrap"><table className="report-table">
            <thead><tr><th>Sonda</th><th>Estado actual</th><th>Días con datos</th><th>Lecturas válidas</th></tr></thead>
            <tbody>{datos.series.map(s => <tr key={s.idSonda}><td>{s.idSonda}</td><td>{s.estado}</td>
              <td>{s.dias.filter(d => d.lecturas > 0).length} / {s.dias.length}</td>
              <td>{s.dias.reduce((n,d) => n+d.lecturas,0)}</td></tr>)}</tbody>
          </table></div>
          <p className="valle-nota">Cada punto es la media aritmética diaria de esa sonda. Los días sin datos quedan como huecos; se permite consultar sondas retiradas.</p>
        </section>
        <section aria-label="Estadísticas por cuadrante">
          <h3>Estadísticas por cuadrante</h3>
          {hayCuadrantes && <div className="report-chart-box analysis-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datos.cuadrantes} margin={{top: 12, right: 20, bottom: 8, left: 8}}>
                <CartesianGrid stroke={grid} vertical={false}/>
                <XAxis dataKey="cuadrante" /><YAxis unit=" m" />
                <Tooltip formatter={v => [metros(v),'Media por sonda']}/>
                <Bar dataKey="promedioM" name="Media por sonda" fill={theme === 'dark' ? '#7ec5cd' : '#2e6e7e'} />
              </BarChart>
            </ResponsiveContainer>
          </div>}
          {!hayCuadrantes && <p>Sin lecturas válidas de sondas activas para el periodo.</p>}
          <div className="report-table-wrap"><table className="report-table">
            <thead><tr><th>Cuadrante</th><th>Sondas con datos / activas</th><th>Lecturas válidas</th><th>Media por sonda</th></tr></thead>
            <tbody>{datos.cuadrantes.map(q => <tr key={q.cuadrante}><td>{q.cuadrante}</td>
              <td>{q.sondasConDatos} / {q.sondasActivas}</td><td>{q.lecturas}</td><td>{metros(q.promedioM)}</td></tr>)}</tbody>
          </table></div>
          <p className="valle-nota">Se calcula primero la media del periodo de cada sonda activa y después la media entre sondas con datos. Usa cuadrante y estado actuales, no una reconstrucción histórica ni una estimación espacial del acuífero.</p>
        </section>
      </>}
    </section>
  );
}

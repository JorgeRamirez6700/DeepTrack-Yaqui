import { useEffect, useState } from 'react';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../services/api.js';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
  'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const now = new Date();
const fmt = (n) => n == null ? 'Sin datos' : `${n.toFixed(2)} m`;

// Protege celdas frente a interpretacion de formulas al abrir CSV con Excel.
function csvCell(value) {
  let text = value == null ? '' : String(value);
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function exportarCsv(datos) {
  const filas = [
    ['DeepTrack Yaqui - datos simulados'],
    ['Periodo', `${MESES[datos.mes - 1]} ${datos.anio}`],
    ['Sondas activas', datos.sondasActivas],
    ['Sondas con datos', datos.sondasConDatos],
    ['Lecturas', datos.lecturas],
    ['Media descriptiva (m)', datos.profundidadMediaM],
    [],
    ['Sonda', 'Cuadrante', 'Lecturas', 'Media (m)', 'Minimo (m)', 'Maximo (m)'],
    ...datos.sondas.map(s => [s.idSonda, s.cuadrante, s.lecturas,
      s.promedioM, s.minimoM, s.maximoM]),
  ];
  const csv = '\uFEFF' + filas.map(fila => fila.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `deeptrack-reporte-${datos.anio}-${String(datos.mes).padStart(2, '0')}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ValleReports() {
  const [meses, setMeses] = useState(12);
  const [tendencia, setTendencia] = useState(null);
  const [errorTendencia, setErrorTendencia] = useState('');
  const [anio, setAnio] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [reporte, setReporte] = useState(null);
  const [errorReporte, setErrorReporte] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    let active = true;
    setErrorTendencia('');
    api.tendenciaValle(meses)
      .then(d => { if (active) setTendencia(d); })
      .catch(err => { if (active) { setTendencia(null); setErrorTendencia(err.message); } });
    return () => { active = false; };
  }, [meses]);

  useEffect(() => {
    let active = true;
    setCargando(true);
    setErrorReporte('');
    api.reporteMensual(anio, mes)
      .then(d => { if (active) setReporte(d); })
      .catch(err => { if (active) { setReporte(null); setErrorReporte(err.message); } })
      .finally(() => { if (active) setCargando(false); });
    return () => { active = false; };
  }, [anio, mes]);

  const anios = Array.from({ length: now.getFullYear() - 2020 + 1 },
    (_, i) => now.getFullYear() - i);
  const datosGrafica = tendencia?.meses.map(p => ({
    ...p, etiqueta: `${MESES[Number(p.mes.slice(5)) - 1].slice(0, 3)} ${p.mes.slice(2, 4)}`,
  })) ?? [];

  return (
    <section className="valle-reports">
      <div className="valle-report-chart">
        <div className="report-header">
          <div><h2>Evolución mensual del Valle del Yaqui</h2>
            <p>Media entre los promedios de las sondas activas con lecturas.</p></div>
          <label>Visualizar{' '}
            <select value={meses} onChange={e => setMeses(Number(e.target.value))}>
              <option value={6}>6 meses</option><option value={12}>12 meses</option>
              <option value={24}>24 meses</option>
            </select>
          </label>
        </div>
        {errorTendencia && <p role="alert" className="error-msg">{errorTendencia}</p>}
        {!errorTendencia && !tendencia && <p role="status">Cargando tendencia…</p>}
        {tendencia && (
          <div className="report-chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datosGrafica} margin={{ top: 12, right: 20, bottom: 8, left: 4 }}>
                <CartesianGrid stroke="#dfe9e5" vertical={false}/>
                <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} minTickGap={16}/>
                <YAxis unit=" m" tick={{ fontSize: 11 }} domain={['auto', 'auto']}/>
                <Tooltip formatter={(v, name) => [fmt(v), name]}
                  labelFormatter={(l) => l}/>
                <Line dataKey="profundidadMediaM" name="Profundidad media" type="monotone"
                  stroke="#2e6e7e" strokeWidth={2.5} dot={{ r: 2 }} connectNulls={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="valle-nota">Los meses sin lecturas aparecen sin valor. Una profundidad mayor indica un espejo de agua más profundo; no representa por sí sola el estado de todo el acuífero.</p>
      </div>

      <div className="valle-report-print" id="reporte-mensual-deeptrack">
        <div className="report-header">
          <div><h2>Reporte mensual del Valle del Yaqui</h2>
            <p>Resumen descriptivo · Datos simulados de desarrollo</p></div>
          <div className="report-controls no-print">
            <label>Año{' '}
              <select value={anio} onChange={e => {
                const year = Number(e.target.value);
                setAnio(year);
                if (year === now.getFullYear() && mes > now.getMonth() + 1)
                  setMes(now.getMonth() + 1);
              }}>{anios.map(a => <option key={a} value={a}>{a}</option>)}</select>
            </label>
            <label>Mes{' '}
              <select value={mes} onChange={e => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={m} value={i + 1}
                  disabled={anio === now.getFullYear() && i > now.getMonth()}>{m}</option>)}
              </select>
            </label>
          </div>
        </div>
        {cargando && <p role="status">Generando reporte…</p>}
        {!cargando && errorReporte && <p role="alert" className="error-msg">{errorReporte}</p>}
        {!cargando && reporte && (
          <>
            <h3 className="print-only">{MESES[reporte.mes - 1]} {reporte.anio}</h3>
            <div className="valle-cards report-cards">
              <div><small>Media por sonda</small><strong>{fmt(reporte.profundidadMediaM)}</strong></div>
              <div><small>Sondas con datos</small><strong>{reporte.sondasConDatos} / {reporte.sondasActivas}</strong></div>
              <div><small>Lecturas del mes</small><strong>{reporte.lecturas}</strong></div>
            </div>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead><tr><th>Sonda</th><th>Cuadrante</th><th>Lecturas</th><th>Media</th><th>Mínimo</th><th>Máximo</th></tr></thead>
                <tbody>{reporte.sondas.map(s => <tr key={s.idSonda}>
                  <td>{s.idSonda}</td><td>{s.cuadrante}</td><td>{s.lecturas}</td>
                  <td>{fmt(s.promedioM)}</td><td>{fmt(s.minimoM)}</td><td>{fmt(s.maximoM)}</td>
                </tr>)}</tbody>
              </table>
            </div>
            <p className="valle-nota">Las sondas sin lecturas permanecen visibles. Los promedios son descriptivos y se calculan para cada sonda antes de consolidarlos. No representan una estimación hidrológica espacial.</p>
            <div className="report-actions no-print">
              <button className="btn-small" type="button" onClick={() => exportarCsv(reporte)}>Exportar CSV (Excel)</button>
              <button className="btn-small" type="button" onClick={() => window.print()}>Imprimir / Guardar PDF</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
import { condicionSonda } from '../utils/filtrarSondas.js';
import { presentacionAlerta } from '../utils/presentacionAlerta.js';
import { etiquetaVigencia, fechaRegistrada, metros } from '../utils/monitoreoSonda.js';

const PRIORIDAD = { alert: 0, warning: 1, unassessed: 2, missing: 3, normal: 4, inactive: 5 };

export default function AlertasPanel({ sondas, revision, cargando, onTrend }) {
  const [criterios, setCriterios] = useState(null);
  const [errorCriterios, setErrorCriterios] = useState('');
  const [filtro, setFiltro] = useState('atencion');
  const [id, setId] = useState('');
  const [historial, setHistorial] = useState(null);
  const [errorHistorial, setErrorHistorial] = useState(null);
  const [reintento, setReintento] = useState(0);
  const filas = useMemo(() => sondas.map(s => ({ ...s, condicion: condicionSonda(s) }))
    .sort((a,b) => PRIORIDAD[a.condicion] - PRIORIDAD[b.condicion] || a.idSonda.localeCompare(b.idSonda)), [sondas]);
  const visibles = filas.filter(s => filtro === 'all' || (filtro === 'atencion'
    ? ['alert','warning','unassessed','missing'].includes(s.condicion) || (s.estado === 'ACTIVA' && s.vigenciaLectura === 'ATRASADA')
    : s.condicion === filtro));
  const actual = historial?.id === id && historial?.revision === revision && historial?.reintento === reintento ? historial.datos : null;
  const fallo = errorHistorial?.id === id && errorHistorial?.revision === revision && errorHistorial?.reintento === reintento ? errorHistorial.mensaje : '';

  useEffect(() => {
    let activo = true;
    api.criteriosAlertas().then(d => { if (activo) { setCriterios(d); setErrorCriterios(''); } })
      .catch(e => { if (activo) { setCriterios(null); setErrorCriterios(e.message); } });
    return () => { activo = false; };
  }, [revision]);
  useEffect(() => {
    if (!id) return;
    let activo = true;
    api.historialAlertas(id).then(datos => {
      if (activo) { setHistorial({ id, revision, reintento, datos }); setErrorHistorial(null); }
    }).catch(e => {
      if (activo) { setHistorial(null); setErrorHistorial({ id, revision, reintento, mensaje: e.message }); }
    });
    return () => { activo = false; };
  }, [id, revision, reintento]);

  return <section className="valle-reports alertas-panel" aria-label="Centro de alertas">
    <div className="report-header"><div><h2>Centro de alertas</h2><p>Evaluación de la última medición; vigencia y estado operativo son independientes.</p></div></div>
    {errorCriterios && <p role="alert" className="error-msg">{errorCriterios}</p>}
    {!criterios && !errorCriterios && <p role="status">Consultando criterios…</p>}
    {criterios && <section className="alert-criteria" aria-label="Criterios configurados">
      <h3>Criterios de evaluación</h3>
      <p>{criterios.habilitada ? 'Límites habilitados' : 'Evaluación deshabilitada: sin criterios aprobados'}</p>
      <div className="alert-criteria-grid">
        <div><small>Límite inferior</small><strong>{metros(criterios.inferiorM)}</strong></div>
        <div><small>Límite superior</small><strong>{metros(criterios.superiorM)}</strong></div>
        <div><small>Margen de advertencia</small><strong>{metros(criterios.margenM)}</strong></div>
      </div>
      <p className="valle-nota">La configuración de desarrollo es demostrativa. No equivale a un diagnóstico hidrológico ni a un aviso automático.</p>
    </section>}
    <section aria-label="Condiciones actuales">
      <div className="alert-section-head"><h3>Condiciones actuales</h3>
        <label>Mostrar <select aria-label="Mostrar condiciones" value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="atencion">Requieren revisión</option><option value="all">Todas</option>
          <option value="alert">Críticas</option><option value="warning">Advertencias</option>
          <option value="normal">Normales</option><option value="missing">Sin datos</option><option value="unassessed">Sin evaluar</option><option value="inactive">No activas</option>
        </select></label>
      </div>
      {cargando && <p role="status">Actualizando condiciones…</p>}
      {!cargando && !visibles.length && <p>No hay sondas que coincidan con el filtro.</p>}
      <div className="report-table-wrap"><table className="report-table">
        <thead><tr><th>Sonda</th><th>Cuadrante</th><th>Lectura</th><th>Condición</th><th>Vigencia</th><th>Acción</th></tr></thead>
        <tbody>{visibles.map(s => {
          const p = presentacionAlerta(s);
          return <tr key={s.idSonda}>
            <td>{s.idSonda}</td><td>{s.cuadrante}</td><td>{metros(s.profundidadActual)}</td>
            <td><span className={`badge ${p.clase}`}>{p.texto}</span><small className="alert-reason">{s.motivoAlerta}</small></td>
            <td>{etiquetaVigencia(s)}<small className="alert-reason">{fechaRegistrada(s.ultimaLecturaFechaHora)}</small></td>
            <td><button type="button" className="btn-small" onClick={() => onTrend(s)}>Ver tendencia</button> <button type="button" className="btn-small" onClick={() => {setHistorial(null);setErrorHistorial(null);setId(s.idSonda);setReintento(n=>n+1);}}>Historial</button></td>
          </tr>;
        })}</tbody>
      </table></div>
    </section>
    <section aria-label="Historial de condiciones">
      <h3>Historial de condiciones</h3>
      <p className="valle-nota">Último mes móvil, reevaluado con las reglas actuales. No es un registro de alertas emitidas en el pasado ni reconstruye el estado operativo histórico.</p>
      <label>Sonda del historial <select aria-label="Sonda del historial" value={id} onChange={e => {setHistorial(null);setErrorHistorial(null);setId(e.target.value);}}>
        <option value="">Seleccionar sonda</option>{filas.map(s => <option key={s.idSonda} value={s.idSonda}>{s.idSonda}</option>)}
      </select></label>
      {id && !actual && !fallo && <p role="status">Consultando historial…</p>}
      {fallo && <p role="alert" className="error-msg">{fallo} <button className="btn-small" onClick={() => setReintento(n=>n+1)}>Reintentar</button></p>}
      {actual && <><p>{actual.coincidencias} mediciones críticas o de advertencia. {actual.coincidencias > 100 ? 'Se muestran las 100 más recientes.' : ''}</p>
        {actual.puntos.length > 0 && <div className="report-table-wrap"><table className="report-table"><thead><tr><th>Fecha registrada</th><th>Lectura</th><th>Nivel</th><th>Motivo</th></tr></thead>
          <tbody>{actual.puntos.map((p,i) => <tr key={i}><td>{fechaRegistrada(p.fechaHora)}</td><td>{metros(p.profundidadM)}</td><td><span className={`badge ${p.nivel === 'CRITICA' ? 'alert' : 'warning'}`}>{p.nivel === 'CRITICA' ? 'Crítica' : 'Advertencia'}</span></td><td>{p.motivo}</td></tr>)}</tbody>
        </table></div>}</>}
    </section>
  </section>;
}

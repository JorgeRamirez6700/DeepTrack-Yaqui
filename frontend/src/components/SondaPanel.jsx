export default function SondaPanel({ sondas, onNew, onEdit, onDelete, onTrend, canManage = false, total, query, onQuery, filter, onFilter, stateFilter, onStateFilter }) {
  return (
    <aside className="side-panel">
      <div className="side-panel-head">
        <h3>Sondas registradas</h3>
        {canManage && <button className="btn-small" onClick={onNew}>+ Nueva</button>}
      </div>

      <div className="monitor-filters"><label>Buscar sonda o cuadrante<input type="search" value={query} onChange={e => onQuery(e.target.value)} placeholder="Ej. SN-YQ o B3" /></label><label>Profundidad<select value={filter} onChange={e => onFilter(e.target.value)}><option value="all">Todas</option><option value="normal">Normal</option><option value="alert">Alertas</option></select></label><label>Estado<select value={stateFilter} onChange={e => onStateFilter(e.target.value)}><option value="all">Todos</option><option>ACTIVA</option><option>INACTIVA</option><option>MANTENIMIENTO</option></select></label><small role="status">{sondas.length} de {total} sondas</small><button type="button" className="btn-small" onClick={() => { onQuery(''); onFilter('all'); onStateFilter('all'); }}>Limpiar filtros</button></div>
      {sondas.length === 0 && <div className="empty-state">{total === 0 ? 'No hay sondas disponibles.' : 'No hay coincidencias con los filtros.'}</div>}

      {sondas.map((s) => (
        <div className="sonda-row" key={s.idSonda}>
          <div className="row-head">
            <span className="sid">{s.idSonda}</span>
            <span className={`badge ${s.enAlerta ? 'alert' : s.profundidadActual == null ? 'unknown' : 'ok'}`}>{s.enAlerta ? 'ALERTA' : s.profundidadActual == null ? 'SIN DATOS' : 'NORMAL'}</span>
          </div>
          <div className="meta">
            Cuadrante {s.cuadrante} · {s.profundidadActual ?? '—'} m · {s.estado}
          </div>
          <div className="row-actions">
            {canManage && <><button className="btn-small" onClick={() => onEdit(s)}>Editar</button>
            <button className="btn-small danger" onClick={() => onDelete(s.idSonda)}>Eliminar</button></>}
            <button className="btn-small" onClick={() => onTrend(s)}>Ver tendencia</button>
          </div>
        </div>
      ))}
    </aside>
  );
}

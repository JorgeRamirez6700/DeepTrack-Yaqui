import { condicionSonda } from '../utils/filtrarSondas.js';

const CLASES = { inactive: 'unknown', missing: 'unknown', normal: 'ok', alert: 'alert' };
const ETIQUETAS = { missing: 'SIN DATOS', normal: 'NORMAL', alert: 'ALERTA' };

export default function SondaPanel({
  sondas, onNew, onEdit, onDelete, onTrend, canManage = false,
  total, query, onQuery, filter, onFilter, stateFilter, onStateFilter,
}) {
  const limpiarFiltros = () => {
    onQuery('');
    onFilter('all');
    onStateFilter('all');
  };

  return (
    <aside className="side-panel">
      <div className="side-panel-head">
        <h3>Sondas registradas</h3>
        {canManage && <button className="btn-small" onClick={onNew}>+ Nueva</button>}
      </div>

      <div className="monitor-filters">
        <label>
          Buscar sonda o cuadrante
          <input type="search" value={query} onChange={e => onQuery(e.target.value)}
            placeholder="Ej. SN-YQ o B3" />
        </label>
        <label>
          Condición (sondas activas)
          <select aria-label="Condición (sondas activas)" value={filter}
            onChange={e => onFilter(e.target.value)}>
            <option value="all">Todas</option>
            <option value="normal">Normal</option>
            <option value="alert">Alertas</option>
            <option value="missing">Sin datos</option>
          </select>
        </label>
        <label>
          Estado
          <select aria-label="Estado" value={stateFilter} onChange={e => onStateFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option>ACTIVA</option>
            <option>INACTIVA</option>
            <option>MANTENIMIENTO</option>
            <option>RETIRADA</option>
          </select>
        </label>
        <small role="status">{sondas.length} de {total} sondas</small>
        <button type="button" className="btn-small" onClick={limpiarFiltros}>Limpiar filtros</button>
      </div>

      {sondas.length === 0 && (
        <div className="empty-state">
          {total === 0 ? 'No hay sondas disponibles.' : 'No hay coincidencias con los filtros.'}
        </div>
      )}

      {sondas.map(s => {
        const condicion = condicionSonda(s);
        return (
          <div className="sonda-row" key={s.idSonda}>
            <div className="row-head">
              <span className="sid">{s.idSonda}</span>
              <span className={`badge ${CLASES[condicion]}`}>{ETIQUETAS[condicion] ?? s.estado}</span>
            </div>
            <div className="meta">
              Cuadrante {s.cuadrante} · {Number.isFinite(s.profundidadActual) ? s.profundidadActual : '—'} m · {s.estado}
            </div>
            <div className="row-actions">
              {canManage && (
                <>
                  <button className="btn-small" onClick={() => onEdit(s)}>Editar</button>
                  {s.estado !== 'RETIRADA' && (
                    <button className="btn-small danger" onClick={() => onDelete(s.idSonda)}>Retirar</button>
                  )}
                </>
              )}
              <button className="btn-small" onClick={() => onTrend(s)}>Ver tendencia</button>
            </div>
          </div>
        );
      })}
    </aside>
  );
}

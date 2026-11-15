export default function SondaPanel({ sondas, onNew, onEdit, onDelete, onTrend, canManage = false }) {
  return (
    <aside className="side-panel">
      <div className="side-panel-head">
        <h3>Sondas registradas</h3>
        {canManage && <button className="btn-small" onClick={onNew}>+ Nueva</button>}
      </div>

      {sondas.length === 0 && <div className="empty-state">No hay sondas registradas todavía.</div>}

      {sondas.map((s) => (
        <div className="sonda-row" key={s.idSonda}>
          <div className="row-head">
            <span className="sid">{s.idSonda}</span>
            <span className={`badge ${s.enAlerta ? 'alert' : 'ok'}`}>{s.enAlerta ? 'ALERTA' : 'NORMAL'}</span>
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

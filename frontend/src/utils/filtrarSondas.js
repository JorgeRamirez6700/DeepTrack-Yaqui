/** Filtros compartidos entre mapa y listado de sondas. */
export function filtrarSondas(sondas, query, filter, stateFilter) {
  const texto = query.trim().toLowerCase();
  return sondas.filter(s => {
    const matches = `${s.idSonda} ${s.cuadrante}`.toLowerCase().includes(texto);
    const alertMatches = filter === 'all' || (filter === 'alert'
      ? s.enAlerta
      : !s.enAlerta && s.profundidadActual != null);
    return matches && alertMatches && (stateFilter === 'all' || s.estado === stateFilter);
  });
}

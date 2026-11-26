/** Una sola regla de clasificación para mapa, filtros y listado. */
export function condicionSonda(sonda) {
  if (sonda.estado !== 'ACTIVA') return 'inactive';
  if (!Number.isFinite(sonda.profundidadActual)) return 'missing';
  return sonda.enAlerta ? 'alert' : 'normal';
}

/**
 * Los filtros son independientes:
 * estado operativo = ACTIVA / RETIRADA / INACTIVA / MANTENIMIENTO;
 * condición = alerta / normal / sin datos, aplicable solo a sondas ACTIVAS.
 * "Todas" preserva el acceso a los históricos de sondas no activas.
 */
export function filtrarSondas(sondas, query = '', filter = 'all', stateFilter = 'all') {
  const texto = query.trim().toLocaleLowerCase('es');
  return sondas.filter(s => {
    if (!`${s.idSonda} ${s.cuadrante}`.toLocaleLowerCase('es').includes(texto)) return false;
    if (stateFilter !== 'all' && s.estado !== stateFilter) return false;
    return filter === 'all' || (
      filter !== 'inactive' && condicionSonda(s) === filter
    );
  });
}

/** Una sola regla de clasificación para mapa, filtros y listado. */
export function condicionSonda(sonda) {
  if (sonda.estado !== 'ACTIVA') return 'inactive';
  if (!Number.isFinite(sonda.profundidadActual)) return 'missing';
  switch (sonda.nivelAlerta) {
    case 'CRITICA': return 'alert';
    case 'ADVERTENCIA': return 'warning';
    case 'NORMAL': return 'normal';
    case 'SIN_DATOS': return 'missing';
    case 'SIN_CRITERIO':
    case 'FECHA_FUTURA': return 'unassessed';
    // Compatibilidad con respuestas y pruebas previas a 0.18.
    default: return sonda.enAlerta ? 'alert' : 'normal';
  }
}

/**
 * Los filtros son independientes:
 * estado operativo = ACTIVA / RETIRADA / INACTIVA / MANTENIMIENTO;
 * condición = alerta / normal / sin datos, aplicable solo a sondas ACTIVAS.
 * "Todas" preserva el acceso a los históricos de sondas no activas.
 */
export function filtrarSondas(sondas, query = '', filter = 'all', stateFilter = 'all', vigenciaFilter = 'all') {
  const texto = query.trim().toLocaleLowerCase('es');
  return sondas.filter(s => {
    if (!`${s.idSonda} ${s.cuadrante}`.toLocaleLowerCase('es').includes(texto)) return false;
    if (stateFilter !== 'all' && s.estado !== stateFilter) return false;
    if (vigenciaFilter !== 'all' && (s.vigenciaLectura ?? 'SIN_CRITERIO') !== vigenciaFilter) return false;
    return filter === 'all' || (
      filter !== 'inactive' && condicionSonda(s) === filter
    );
  });
}

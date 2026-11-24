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
    if (filter === 'all') return true;
    if (s.estado !== 'ACTIVA') return false;
    const hayDatos = s.profundidadActual != null && Number.isFinite(s.profundidadActual);
    switch (filter) {
      case 'normal': return hayDatos && !s.enAlerta;
      case 'alert': return hayDatos && s.enAlerta;
      case 'missing': return !hayDatos;
      default: return false;
    }
  });
}

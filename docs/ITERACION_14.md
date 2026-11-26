# Iteración 0.14 — Refactorizado y Optimizado

## Objetivo
Reducir duplicación y garantizar resultados coherentes sin modificar contratos REST, esquema, estilos ni dependencias de ejecución.

## Cambios
- Frontend: una sola función de clasificación de sondas, compartida por mapa, filtros, listado y contador de alertas. Estados no activos permanecen accesibles con Todas; valores ausentes/no finitos no se consideran normales. Los filtros conservan su apariencia y reciben nombres accesibles explícitos. SondaPanel se reestructura para facilitar la lectura del JSX. Los contadores se calculan en un único recorrido memoizado por la colección.
- Backend: listado y detalle utilizan el mismo desempate de última lectura (fecha descendente e ID descendente). Esto también hace consistente la detección de lecturas repetidas al editar. No cambia el esquema ni se borra histórico.
- Estadísticas y reportes: se omite la consulta de lecturas si no existen sondas activas. Conserva las respuestas vacías y los meses sin datos.
- QA: pruebas de clasificación, empate de fecha con JPA/H2, y ausencia de consultas de lecturas cuando no hay activas. Playwright comprueba el flujo real de edición de metadatos con decimales sin duplicados, y usa nombres accesibles de filtros.

## Verificación
- Referencia antes del refactor: Actions 45736308109, backend y frontend aprobados. Playwright 2/3: concurrencia y permisos aprobados; flujo de sondas se detuvo por un selector de Estado sin nombre exacto reconocible (no llegó a verificar la reactivación).
- Correr toda la CI (Maven, Node, Vite, Chromium/H2) después de aplicar los cambios; los resultados publicados en Actions son la evidencia.
- No se añaden dependencias en esta iteración (Playwright ya se añadió en la ronda de QA anterior). No se realizan benchmarks ni cambios de configuración de producción.

## Pendientes de importancia
- #9: SRS define profundidad desde superficie hasta agua. Confirmar cero, signo, unidad y límites del sensor antes de usar mediciones firmadas institucionales.
- La regla de reportes usa el estado actual de sondas: sigue pendiente decidir cómo reconstruir población histórica de un periodo.
- Las consultas de periodos aún pueden cargar muchas lecturas; medir con datos representativos y SQL Server antes de trasladar agregación a SQL. No confundir reducción de consultas en el caso vacío con mejora medida de latencia.
- Validación de Google Maps con clave real y tiempos RNF-08/09, Firefox/Edge y SQL Server siguen pendientes.
- Las advertencias de deprecación de las versiones de acciones de GitHub y Node 20 requieren una actualización aislada, no incluida en este refactor.

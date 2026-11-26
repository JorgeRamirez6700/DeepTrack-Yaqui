# Iteración 0.15 — Monitoreo detallado de sondas

## Alcance
Ampliación de RF-03, RF-04 y RF-05 (HU-07 a HU-09): la fecha de última medición es parte del diccionario de datos del SRS; se añade una dimensión de vigencia y estadística descriptiva por sonda como mejora de producto. Se conserva el modal histórico y los rangos existentes.

- API: `SondaDTO` agrega `ultimaLecturaFechaHora` y `vigenciaLectura` a las respuestas existentes. El listado mantiene la consulta en lote de últimas lecturas, sin consulta por sonda. Histórico excluye fechas posteriores al instante de consulta y ordena empates por ID.
- Vigencia: RECIENTE, ATRASADA, SIN_DATOS, SIN_CRITERIO y FECHA_FUTURA. Se evalúa en el servidor al consultar, independientemente de condición de profundidad y estado operativo. `DEEPTRACK_VIGENCIA_HORAS` en dev tiene 48 horas por defecto como parámetro provisional; 0 desactiva criterio. Fuera de dev el valor por defecto es 0; configurar `deeptrack.monitoreo.vigencia-horas` tras acordar frecuencia. No representa conexión física ni modifica la bandera de alerta.
- Listado y hover muestran fecha/condición de vigencia; filtro independiente y contador de activas atrasadas en Inicio. Se actualizan con las consultas existentes, no hay polling.
- Ficha: última lectura, fecha, estado, vigencia; por rango: cantidad válida, mínimo, media aritmética, máximo, variación última menos primera (sin inventar valor si hay menos de dos lecturas). Gráfica en eje temporal, interpolación lineal y punto visible para una medición; se conservan signos y se omiten valores no finitos en los indicadores. No se interpreta el signo como riesgo. Hora registrada sin zona horaria; la escala del navegador preserva la hora literal de LocalDateTime, no afirma UTC ni la zona del sensor.
- Sin cambios de esquema ni nuevas dependencias. No se introducen PDF/Excel, umbrales hidrológicos adicionales ni notificaciones.

## QA
Pruebas unitarias de vigencia (incluidos límite, futuro y desactivación), clasificación y resumen; integración H2 para orden de empates y exclusión de futuro; Playwright comprueba ficha, estadística firmada, filtro, ausencia de datos, además de flujos anteriores. El caso de vigencia atrasada en navegador usa una respuesta controlada; regla real cubierta en Java.

## Pendientes
Frecuencia real de transmisión, zona horaria y referencia física de profundidad (Issue #9), lectura de SQL Server institucional, Google Maps con clave real, tiempos RNF-08/09 y pruebas adicionales de navegador. Los datos de desarrollo no constituyen telemetría en tiempo real. El umbral de 48 h es solo demostrativo.

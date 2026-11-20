# Iteración 0.5 — revisión y resumen estadístico del valle

## Qué cambia

- Primer commit: `docs/REVISION_05.md` documenta los problemas encontrados en la revisión de código.
- Corregida la detección de IDs duplicados con espacios al crear sondas y añadida validación de coordenadas.
- Nuevo endpoint autenticado: `GET /api/estadisticas/resumen?periodo=dia|semana|mes`.
- El Dashboard muestra un resumen del periodo calendario actual (hoy, lunes a hoy, primer día del mes a hoy).
- Indicadores: sondas activas, cobertura de sondas con datos, total de lecturas, media de medias por sonda, menor y mayor media individual.
- Tests unitarios: evitar sesgo por distinta frecuencia de las lecturas; responder correctamente sin datos; rechazar rango inválido.

## Interpretación de los datos

La media del valle es la media aritmética de los **promedios individuales de las sondas activas con datos en el periodo**, no la media de todas las lecturas (que sobrerrepresentaría sondas de alta frecuencia). Esto es un indicador descriptivo de los dispositivos monitoreados, no una estimación de la profundidad del acuífero en su conjunto. Si faltan lecturas, el indicador de cobertura las hace visibles. Los datos H2 son simulados.

## Prueba manual

1. Arrancar backend y frontend como en el README.
2. Iniciar sesión, observar el nuevo bloque por encima del mapa.
3. Cambiar entre Hoy, Esta semana y Este mes; verificar que cambian los indicadores y que no hay recarga.
4. Registrar una sonda con ID que incluya espacios alrededor del ID existente: debe devolver HTTP 409.
5. Intentar crear una sonda con latitud mayor a 90: debe responder HTTP 400.
6. Verificar que GET /api/estadisticas/resumen requiere login (401 sin autenticación).

## Pendientes

- No se ha hecho merge de PR #1 (0.3) ni PR #2 (0.4); esta rama parte de 0.4 y debe revisarse después de integrar esas dependencias.
- No existe todavía un informe mensual exportable por mes específico, solo resumen del periodo actual.
- El borrado físico sigue eliminando históricos: decidir desactivación/recuperación antes de modificar esa API.
- No hay integración con SQL Server real; Hibernate en producción valida el esquema existente.
- Los promedios se calculan en memoria desde todas las lecturas del rango. Para gran volumen, migrar a agregaciones SQL o consultas paginadas.

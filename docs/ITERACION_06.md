# Iteración 0.6 — Tendencias y reportes mensuales

## Funcionalidades
- `GET /api/reportes/tendencia?meses=6|12|24`: serie de medias mensuales (incluye puntos nulos en meses sin lecturas), junto con número de sondas con datos y lecturas.
- `GET /api/reportes/mensual?anio=2026&mes=11`: reporte de un mes calendario seleccionado, con datos por sonda, promedio, mínimo, máximo, cobertura y total de lecturas.
- Panel de gráfica de evolución de 6, 12 o 24 meses en el Dashboard, usando Recharts.
- Selector de año y mes; tabla de sondas activas (incluye sondas sin lecturas).
- Exportación CSV compatible con Excel con BOM UTF-8 y mitigación básica de fórmulas en celdas.
- Estilo de impresión para usar **Imprimir → Guardar como PDF** en el navegador, sin servicio PDF separado.

## Reglas de cálculo
- Solo se consideran sondas con estado ACTIVA en el estado actual de la BD, no la condición histórica de cada equipo.
- Un promedio de todas las lecturas puede sobreponderar equipos con mayor frecuencia. Se calcula primero la media de lecturas de cada sonda y después la media de esas medias.
- La consulta usa intervalos cerrados-abiertos por mes calendario y mantiene ausencia de mediciones como `null`; no se interpolan valores.
- Estos indicadores no miden de forma directa la disponibilidad de agua del acuífero ni el volumen regional.
- Los datos de H2 siguen siendo simulados.

## Validación
- GitHub Actions: Java 17 Maven clean verify y Node 20 Vite build.
- JUnit: cobertura por sonda, cálculo de media sin sesgo por frecuencia, meses sin lecturas y rechazo de parámetros inválidos.
- Pruebas manuales: revisar el gráfico en 6/12/24 meses; seleccionar mes anterior, cambiar año; exportar CSV, abrirlo en Excel/LibreOffice; imprimir y guardar PDF con vista previa; comprobar que endpoints sin login responden 401.

## Pendientes
- La impresión PDF depende del navegador y no incluye generación automática en servidor.
- La consulta agrega lecturas en memoria; optimizar mediante agregación en SQL Server cuando exista esquema institucional y carga representativa.
- No hay estado histórico de activación/desactivación; la cobertura se calcula usando sondas activas actualmente.
- No se han validado mediciones institucionales ni reglas oficiales de reporte mensual.
- Los PR #1, #2 y #3 aún están abiertos. Este desarrollo parte de la rama 0.5 y **no debe fusionarse antes de sus dependencias**.

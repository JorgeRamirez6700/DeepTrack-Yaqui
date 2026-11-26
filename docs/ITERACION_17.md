# Iteración 0.17 — Análisis avanzado

Ampliación propuesta del RF-04/RF-05 y del monitoreo regional: comparación entre sondas, estadísticas por cuadrante e intervalos personalizados. No son requisitos nuevos previamente aprobados del SRS.

- Estadísticas: panel de análisis con fechas inclusivas, hasta cinco sondas seleccionadas (incluidas retiradas), media diaria y huecos sin datos, cobertura y conteo. Cuadrantes: todas las sondas actualmente activas, media de las medias individuales del periodo; las sondas sin datos cuentan para cobertura, no para la media. Cuadrante y estado son los actuales, no históricos. No estima niveles espaciales.
- API GET /api/estadisticas/analisis?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&ids=A&ids=B. Una consulta de lecturas por lote de hasta 1000 identificadores; el resultado diario es acotado, pero cada lote todavía carga lecturas en memoria.
- Histórico individual: GET /api/sondas/{id}/historico/intervalo; conserva rangos anteriores y exportaciones. PDF y XLSX reflejan el intervalo aplicado y las fechas observadas; cambiar campos sin aplicar no cambia el resultado exportable.
- Fechas desde 2000, hasta hoy, máximo 366 días inclusive; hasta el momento de consulta del servidor, sin asumir zona horaria del sensor. El límite de cinco sondas y 366 días son decisiones provisionales de usabilidad y carga.
- #16: excluir fechas futuras de estadísticas y reportes consolidados sin borrar registros. Regresión de integración H2.
- Sin nuevas dependencias, cambios de esquema ni main. Pruebas Node, H2 y navegador. Aún no se verifican SQL Server real, Google Maps con clave, desempeño con telemetría masiva ni zona y referencia física. Los informes de comparación y cuadrante no se exportan en esta iteración.

# Iteración 0.16 — Implementacion Excel y PDF

RF-06 / HU-16 / CU6: exportación individual desde la ficha de la sonda. Generación local, sin endpoints ni escrituras nuevas; conserva roles existentes y reportes consolidados. Se cargan jsPDF 4.2.1 y write-excel-file 4.1.1 por importación dinámica al solicitar descarga; read-excel-file 9.2.0 es solo para pruebas. Se consultaron versiones y documentación de las bibliotecas; no equivale a auditoría de todas sus dependencias transitivas.

- PDF A4: identificación, estado, rango, fechas observadas, lectura general y vigencia, métricas del periodo, gráfica vectorial temporal, fecha de generación y notas de referencia. No incluye tabla completa; Excel contiene la serie.
- XLSX: hojas Resumen y Lecturas, valores numéricos firmados, fechas de lectura como texto ISO literal (sin reinterpretar zona), campos de identificación como texto y valores no válidos vacíos. No incluye gráfica editable de Excel.
- Las exportaciones usan la misma instantánea de los puntos visibles, no consultan nuevamente la API. Los botones se deshabilitan durante carga, error, exportación y ausencia de datos válidos. Cambiar rango limpia el resultado anterior.
- Se conserva precisión numérica en XLSX; PDF usa dos decimales como la ficha. Las fechas de generación están en UTC; la hora de medición no tiene zona definida. No se añade logotipo institucional ni se certifican criterios hidrológicos.
- Pruebas Node de archivos reales (lectura de XLSX, firma PDF e indicadores) y Playwright de descargas, contenido, nombres y estado sin datos. Pruebas de CI documentan resultados.
- Límite: generación en memoria, sin benchmark con millones de lecturas; validar volúmenes reales, presentación impresa y apertura en Excel de escritorio. No altera main.

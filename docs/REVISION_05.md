# Iteración 0.5 — Revisión de inicio de jornada

Revisión estática realizada sobre `feature/iteracion-04-autenticacion` antes de modificar código. Los resultados de CI de la iteración 0.4 eran satisfactorios; **el navegador real y SQL Server no están validados**.

## Hallazgos priorizados

1. **Alta de sonda: validación de duplicados inconsistente.** `SondaService.crear` comprueba `existsById(req.idSonda())` pero persiste `req.idSonda().trim()`: una entrada con espacios alrededor puede evadir la comprobación y provocar error de BD en lugar de HTTP 409. Corregir en esta iteración.
2. **Validación geográfica insuficiente.** `SondaRequest` requiere latitud y longitud, pero no limita sus rangos geográficos. Agregar restricciones.
3. **Reporte general ausente.** Solo existe el historial por sonda. Incorporar resumen del Valle del Yaqui basado en **una media por sonda**, para no dar más peso a las sondas que reportan con mayor frecuencia. Incluir cobertura de sondas con lecturas.
4. **Borrado irreversible de históricos.** `SondaService.eliminar` elimina lecturas de la sonda. **No cambiar el significado del endpoint sin definir el flujo de desactivación y recuperación**; queda como riesgo de producto.
5. **Rendimiento.** La lista de sondas consulta una lectura reciente por cada sonda (N+1). Aceptable para los cinco registros simulados, pendiente de optimizar antes de expandir a muchos pozos.

## Alcance y limitaciones

Este informe deriva del código; no supone datos reales ni certifica la precisión hidrológica de promedios. La nueva estadística será descriptiva de las sondas monitoreadas, **no una estimación física del acuífero**. El código de la iteración 0.5 vive en una rama derivada de 0.4; no hacer merge hasta integrar y revisar los PR anteriores.

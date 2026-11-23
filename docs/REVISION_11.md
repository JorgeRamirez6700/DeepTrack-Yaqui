# Verificación de la iteración 0.11 — 22 de noviembre de 2026

## Evidencia automatizada
- Los workflow runs sobre `dev` / commit `3fb9d4b` concluyeron con éxito en Java/Maven y frontend/Vite.
- Los runs anteriores, sobre `918f00a`, fallaron en `testCompile` porque la prueba invocaba `deleteByIdSonda` después de eliminar ese método del repositorio; la referencia se corrigió en `3fb9d4b`.
- `RetiroSondaIntegrationTest` verifica contra JPA/H2, con `flush` y `clear` entre operaciones, conservación de lectura, recuperación de historial y reactivación sin borrado.
- Estas pruebas **no** constituyen una comprobación de reinicio del proceso ni una integración con SQL Server.

## Riesgos / decisiones de producto
1. **Reportes históricos:** `ReportesService.activas()` selecciona por el estado ACTIVA actual. Al retirar o reactivar una sonda, cambia su participación en reportes de periodos anteriores, aunque las lecturas permanezcan intactas. No modificar automáticamente sin fechas de vigencia/intervalos de actividad.
2. **Sin fechas de retiro/reactivación:** `Sonda.estado` es solo el estado actual, no guarda intervalos históricos. Para auditorías y reportes institucionales agregar historial de estados o registros de eventos con fecha y actor.
3. **SQL Server sin verificación:** el perfil prod usa `ddl-auto: validate` y no cambia esquema. Debe comprobarse la tabla `sonda`, capacidad y restricciones de `estado` para `RETIRADA`, columnas e índices de `lectura`, y las tablas de usuarios con el equipo de TI. Un `CHECK` que no admita RETIRADA fallará al actualizar.
4. **Pruebas E2E pendientes:** retirar desde la interfaz, filtrar RETIRADA, consultar tendencias y reactivar; reabrir aplicación sobre H2 persistente y comprobar que no repone datos; probar roles y bloqueo de nuevas lecturas.
5. **Validación de profundidad:** el DTO permite valores negativos y no finitos como `Double`; conviene reforzar esta validación antes de telemetría real.
6. **Semántica de DELETE:** ahora retira en lugar de borrar; clientes externos deben conocer el cambio.

## Guía de verificación manual
Usar una sonda ficticia, no equipos de producción. Antes del retiro anotar ID, última lectura, número de puntos en el histórico y cifras del reporte. Retirar, confirmar estado RETIRADA, revisar histórico y que no genere alerta activa. Reiniciar backend con H2 persistente y repetir la consulta. Reactivar con estado ACTIVA y comprobar que se mantiene el histórico anterior. Evaluar por separado la variación de promedios de reportes con el equipo funcional.

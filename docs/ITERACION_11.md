# Iteración 0.11 — Retiro lógico de sondas

La eliminación física se sustituyó por retiro lógico, sin cambiar la ruta DELETE. Se conserva el registro de la sonda y **todas** sus lecturas en H2. La sonda pasa a `RETIRADA`; el histórico individual sigue disponible, y es posible reactivarla editando a `ACTIVA`.

## Comportamiento
- `DELETE /api/sondas/{id}` devuelve 204 y cambia el estado a RETIRADA; no elimina registros. Si ya está retirada devuelve 409.
- `PUT /api/sondas/{id}` con estado ACTIVA permite reactivarla sin perder el ID.
- Las sondas no activas (RETIRADA, INACTIVA, MANTENIMIENTO) no admiten **nuevas lecturas manuales** mediante edición de sus datos. La edición sin lectura permanece permitida.
- Las alertas actuales solo corresponden a sondas ACTIVAS; las últimas lecturas antiguas no se muestran como alertas en una retirada.
- La interfaz renombra Eliminar como Retirar, incluye RETIRADA en filtros y formularios y permite consultar históricos.
- Se eliminó del repositorio el método JPA de borrado de lecturas para reducir riesgos de uso accidental.

## Pruebas
- JUnit: retiro conserva registro y lecturas, repetir retiro devuelve 409, histórico sigue accesible, sin alerta actual, bloqueo de lecturas nuevas y reactivación.
- QA manual: retirar sonda ficticia, comprobar filtro RETIRADA, abrir historial, reiniciar el backend y comprobar persistencia, reactivar y comprobar histórico.
- Verificar que DIRECTOR/CONSULTA no dispongan de acciones de gestión.

## Limitaciones importantes para la revisión
- Los reportes consolidados anteriores calculan **solo sondas con estado ACTIVA actualmente**. Una sonda retirada conserva su histórico individual, pero deja de participar en el agregado histórico de esos reportes. Esto queda pendiente de un modelo temporal de estados para los reportes institucionales.
- No existe todavía marca de tiempo de retiro; para reconstruir el parque histórico necesitaríamos fecha de instalación, estado y fecha de retiro.
- La ruta DELETE ya no elimina físicamente; integraciones externas deberán revisar esta semántica.
- No hay migración de SQL Server: se usa el valor textual RETIRADA en la columna estado existente. Debe validarse su compatibilidad con el esquema real.
- Una sonda eliminada físicamente **antes** de esta versión no puede recuperarse con este cambio.

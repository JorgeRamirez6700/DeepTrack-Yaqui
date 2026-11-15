# Iteración 0.4 — sesiones seguras y roles

## Alcance
- Login real mediante BCrypt ya existente, con sesión HTTP guardada en Spring Security.
- Protección de endpoints y autorización: lectura de sondas para cualquier usuario autenticado; escritura de sondas para ADMINISTRADOR o ANALISTA; gestión de usuarios solo ADMINISTRADOR.
- CSRF en todos los cambios de estado, incluido el login: el cliente obtiene un token por `GET /api/auth/csrf` y lo manda en `X-CSRF-TOKEN`.
- `GET /api/auth/me` comprueba si la sesión continúa activa.
- `POST /api/auth/logout` invalida la sesión.
- Sesión almacenada en cookie HttpOnly SameSite=Lax; 30 minutos de inactividad.

## Pruebas manuales
1. Ejecutar backend (`mvn spring-boot:run`) y frontend (`npm install && npm run dev`).
2. Login admin/admin123: debe mostrar mapa; crear sondas y usuarios debe funcionar.
3. Login analista/analista123: puede gestionar sondas, pero `/api/usuarios` devuelve 403.
4. Sin sesión: `GET /api/sondas` devuelve 401.
5. Intentar POST sin CSRF: devuelve 403.
6. Logout y actualizar la página: vuelve al login.

## Límites de esta versión
- Perfiles de producción requieren HTTPS y `DEEPTRACK_COOKIE_SECURE=true`; configurar proxy TLS correctamente.
- La información de roles se captura al iniciar sesión: cambios administrativos de roles o revocaciones de cuentas no terminan sesiones preexistentes de inmediato.
- El perfil de desarrollo crea usuarios de ejemplo; **no publicar ese perfil en Internet**.
- No se implementa todavía recuperación de contraseñas, limitación de intentos ni auditoría de acceso.
- La integración SQL Server y los reportes mensuales siguen pendientes.

# Iteración 0.4 — sesiones seguras y roles

## Alcance
- Login real mediante BCrypt ya existente, con sesión HTTP guardada en Spring Security.
- Protección de endpoints y autorización: lectura de sondas para cualquier usuario autenticado; escritura de sondas para ADMINISTRADOR o ANALISTA; gestión de usuarios solo ADMINISTRADOR.
- CSRF en todos los cambios de estado, incluido el login: el cliente obtiene un token por `GET /api/auth/csrf` y lo manda en `X-CSRF-TOKEN`.
- `GET /api/auth/me` comprueba si la sesión continúa activa.
- `POST /api/auth/logout` invalida la sesión.
- Sesión almacenada en cookie HttpOnly SameSite=Lax; 30 minutos de inactividad.

## Depuración adicional (16-11-2026)
- Comprobación de vigencia de la cuenta y rol en cada petición autenticada.
- La interfaz regresa al inicio de sesión si recibe HTTP 401 durante una petición protegida.
- Nuevas pruebas de integración para revocación por desactivación de usuario y cambio de rol.
- Cookie de sesión marcada `Secure` en perfil `prod`.

## Pruebas manuales
1. Ejecutar backend (`mvn spring-boot:run`) y frontend (`npm install && npm run dev`).
2. Login admin/admin123: debe mostrar mapa; crear sondas y usuarios debe funcionar.
3. Login analista/analista123: puede gestionar sondas, pero `/api/usuarios` devuelve 403.
4. Sin sesión: `GET /api/sondas` devuelve 401.
5. Intentar POST sin CSRF: devuelve 403.
6. Logout y actualizar la página: vuelve al login.

## Límites de esta versión
- En el perfil `prod`, la cookie lleva `Secure`; desplegar solo mediante HTTPS y configurar el proxy TLS correctamente.
- En cada petición autenticada se verifica que la cuenta siga activa y conserve el mismo rol; si se desactiva o cambia, se invalida la sesión existente (consultas adicionales a la BD).
- El perfil de desarrollo crea usuarios de ejemplo; **no publicar ese perfil en Internet**.
- No se implementa todavía recuperación de contraseñas, limitación de intentos ni auditoría de acceso.
- La integración SQL Server y los reportes mensuales siguen pendientes.

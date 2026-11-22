# Iteración 0.10 — Administración de usuarios

Rama dev, dos commits. Panel exclusivo para ADMINISTRADOR: listar, buscar, crear y editar nombre, rol y estado. No se elimina cuentas ni se cambia contraseña de cuentas existentes. El servidor protege /api/usuarios, valida entradas y evita degradar o desactivar la propia cuenta. BCrypt, CSRF y revocación de sesiones existentes se mantienen.

Prueba manual: admin crea cuenta CONSULTA, modifica rol, desactiva y reactiva; comprobar login denegado al inactivo y revocación en próxima petición, 403 para analista en API, acceso directo #usuarios no privilegiado, rechazo al auto-bloqueo, duplicados, campos y ambos temas. No usar contraseñas reales de producción en desarrollo.

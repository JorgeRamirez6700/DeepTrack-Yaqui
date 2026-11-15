# Iteración 0.3 — CI y calidad del repositorio

## Objetivo

Preparar DeepTrack Yaqui para iteraciones revisables mediante ramas, pull requests y pruebas automáticas en GitHub Actions, sin cambiar todavía el comportamiento funcional.

## Cambios

- `.github/workflows/ci.yml`: en push y pull requests ejecuta `mvn clean verify` (Java 17) y `npm run build` (Node 20).
- `.gitignore`: excluye credenciales locales, datos H2, artefactos de compilación y dependencias.
- `frontend/.env.example`: documenta las variables necesarias sin incluir secretos.
- `AuthServiceTest`: cuatro pruebas unitarias de login: correcto, contraseña incorrecta, usuario inactivo y usuario inexistente.

## Validación

1. Abrir la pestaña **Actions** de GitHub y verificar ambos trabajos.
2. Localmente: `cd backend && mvn clean verify`.
3. Localmente: `cd frontend && npm install && npm run build`.
4. Configurar `frontend/.env.local` copiando `.env.example` y usando una clave de Google Maps restringida.
5. Confirmar que `backend/data/` y `frontend/.env.local` no aparecen en `git status`.

## Límites y pendientes

- **Seguridad**: el login aún no establece sesión protegida; los endpoints requieren control de acceso en la siguiente iteración.
- **Datos**: H2 contiene datos simulados. SQL Server institucional sigue pendiente.
- **CI**: la compilación del frontend no equivale a pruebas de interacción del mapa ni del login.
- **Dependencias**: actualmente no hay `package-lock.json` en Git; `npm install` no fija exactamente las versiones. Agregar lockfile validado y migrar CI a `npm ci` cuando se genere.
- **Informes mensuales consolidados**: aún no implementados.

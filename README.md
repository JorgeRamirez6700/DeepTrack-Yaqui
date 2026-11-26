# DeepTrack Yaqui

Aplicación web de monitoreo de profundidad de pozos del Valle del Yaqui. Incluye mapa de sondas, tendencias, estadísticas, reportes y gestión de usuarios por rol.

> **Guía rápida de pruebas (rama `dev`).** Usa solamente datos ficticios y el perfil local `dev`. No necesitas SQL Server para evaluar la aplicación.

## 1. Preparar el equipo

Instala **Java JDK 17**, **Maven 3.9+**, **Node.js 20.19+** (o 22.12+) y Git. Comprueba que estén disponibles:

```bash
java -version
mvn -version
node -v
npm -v
```

Descarga el proyecto y cambia a la rama de pruebas:

```bash
git clone https://github.com/JorgeRamirez6700/DeepTrack-Yaqui.git
cd DeepTrack-Yaqui
git switch dev
```

Si ya lo tienes clonado, desde el directorio del proyecto usa `git switch dev` y `git pull origin dev` (guarda primero tus cambios locales).

## 2. Ejecutar la aplicación

Abre **dos terminales**, ambas desde la carpeta del repositorio.

**Terminal 1 — Backend** (mantén abierta):

```bash
cd backend
mvn spring-boot:run
```

El backend usa una base de pruebas **H2 local persistente** en `backend/data/`. La primera vez crea sondas y usuarios ficticios; los datos modificados se conservan entre reinicios.

**Terminal 2 — Frontend** (mantén abierta):

```bash
cd frontend
npm install
npm run dev
```

Abre **http://localhost:5173** en el navegador, después de que el backend termine de iniciar. Las llamadas `/api` se redirigen automáticamente a `http://localhost:8080`.

**Google Maps es opcional para comenzar.** Para ver el mapa real, habilita *Maps JavaScript API* en Google Cloud, crea una clave restringida a tus orígenes autorizados y copia `frontend/.env.example` como `frontend/.env.local` (desde la carpeta `frontend`). Sustituye `REEMPLAZAR_CON_CLAVE_DE_GOOGLE_MAPS` por tu clave y reinicia Vite. Sin clave, aparecerá el mensaje informativo del mapa; el resto de las funciones se puede probar.

## 3. Entrar con cuentas de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Administrador | `admin` | `admin123` |
| Analista | `analista` | `analista123` |

Estas credenciales se crean **solo en una base de desarrollo inicialmente vacía**; si fueron cambiadas, utiliza las cuentas existentes. **Nunca uses estas contraseñas en producción ni publiques datos o claves reales**.

## 4. Mini checklist para el tester

- [ ] **Inicio y navegación:** inicia y cierra sesión; cambia entre Inicio, Mapa, Estadísticas, Reportes y Configuración; verifica menú móvil y temas claro/oscuro.
- [ ] **Sondas:** busca una sonda por ID o cuadrante; prueba filtros y el botón **Actualizar datos**; abre **Ver tendencia** y cambia el rango de fechas.
- [ ] **Reportes:** cambia mes/año; revisa las gráficas, exporta CSV y usa imprimir/guardar como PDF.
- [ ] **Permisos:** con Administrador comprueba **Usuarios** (crear/editar una cuenta ficticia). Con Analista confirma que no pueda administrar usuarios.
- [ ] **Retiro sin pérdida:** con una sonda ficticia anota su histórico, pulsa **Retirar**, filtra por `RETIRADA`, comprueba que el histórico se conserva y reactívala desde **Editar**.
- [ ] **Errores y fluidez:** prueba anchos de pantalla diferentes, navegación rápida, formularios vacíos/inválidos y mensajes de error. Anota cualquier retraso, pantalla en blanco o comportamiento inesperado.

**Importante:** los reportes consolidados consideran el estado **actual** de las sondas; retirar una puede cambiar los totales mostrados de periodos anteriores. Es una limitación conocida, no una pérdida de lecturas. El mapa requiere clave válida de Google Maps.

## 5. Cómo reportar un error

Para que dos testers puedan reproducir el mismo problema, envíen un reporte por anomalía con estos datos:

```text
Título:
Sección / URL:
Rol usado:
Pasos para reproducir (1, 2, 3):
Resultado esperado:
Resultado obtenido:
Navegador y sistema operativo:
¿Ocurre siempre o a veces?:
Captura o mensaje de consola (si existe):
```

Añade, si es posible, una captura de pantalla y el mensaje de **F12 → Console** o **Network**. No compartas contraseñas, cookies de sesión, tokens CSRF ni claves de Maps. Pueden registrar los problemas en **Issues** de GitHub: https://github.com/JorgeRamirez6700/DeepTrack-Yaqui/issues

## Referencia técnica breve

- `dev`: H2 local persistente y datos ficticios; `main`: versión integrada y estable del repositorio.
- `prod`: SQL Server institucional; requiere `DB_URL`, `DB_USER`, `DB_PASSWORD` y validación previa del esquema.
- Seguridad: sesiones con cookie HttpOnly, CSRF, contraseñas BCrypt y permisos por rol.
- `GET /api/sondas`: consulta sondas; `GET /api/sondas/{id}/historico?rango=mes`: histórico; `DELETE /api/sondas/{id}`: **retiro lógico**, no borrado físico.
- Validación automatizada: `cd backend && mvn clean verify` y, en `frontend`, `npm test` y `npm run build`.
- Pruebas completas de navegador: desde `frontend`, ejecutar `npm install`, `npx playwright install chromium` y `npm run test:e2e`. Cerrar primero los servidores locales (puertos 8080 y 5173); Playwright inicia sus propios servidores y H2 en memoria. En Linux puede ser necesario `npx playwright install --with-deps chromium`. No requiere Google Maps ni datos reales.

Documentación detallada de las iteraciones y límites conocidos en `docs/`.

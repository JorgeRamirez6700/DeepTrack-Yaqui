# DeepTrack Yaqui

Aplicación web para el monitoreo de la profundidad de pozos del Valle del Yaqui: mapa interactivo de sondas (Google Maps), consulta de lecturas y gráficas de tendencia histórica.

Monorepo con dos aplicaciones, según la Arquitectura Técnica v0.1:

```
deeptrack-yaqui/
├── backend/    API REST — Java 17 + Spring Boot 3 + JPA (Maven)
├── frontend/   SPA — React 18 + Vite + Google Maps + Recharts
└── docs/       Documentación del proyecto (Visión, SRS, Arquitectura, Backlog, Plan de pruebas)
```

## Requisitos

| Herramienta | Versión |
|---|---|
| JDK | 17 o superior |
| Maven | 3.9+ |
| Node.js | 18 o superior |

## Puesta en marcha (desarrollo)

**1. Backend** (puerto 8080) — usa H2 persistente en `backend/data/` con datos de muestra; no toca ninguna BD real:

```bash
cd backend
mvn spring-boot:run
```

La primera ejecución genera 5 sondas ficticias y un año de lecturas diarias más lecturas intradía. El archivo de BD se guarda en `backend/data/deeptrack.mv.db` y se mantiene entre reinicios. Al reiniciar **no se sobrescriben las sondas ni lecturas existentes**. Ejecuta Maven desde `backend/` para que la ruta relativa sea correcta.

Para restaurar los datos de muestra, detén el backend y elimina la carpeta `backend/data/` (esto borra los datos locales, no SQL Server). No compartas esa carpeta en Git ni en entregas públicas.

Usuarios de prueba (solo perfil `dev`): `admin` / `admin123` y `analista` / `analista123`.

**2. Frontend** (puerto 5173):

```bash
cd frontend
cp .env.example .env.local      # y completa VITE_GOOGLE_MAPS_API_KEY
npm install
npm run dev
```

Abre http://localhost:5173. Vite redirige `/api` al backend automáticamente.

**Pruebas del backend:** `cd backend && mvn test`

## API REST

| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login básico (valida contra BD; **sin token todavía**) |
| GET | `/api/sondas` | Lista de sondas con última lectura y bandera de alerta |
| GET | `/api/sondas/{id}` | Detalle de una sonda |
| POST | `/api/sondas` | Alta de sonda |
| PUT | `/api/sondas/{id}` | Edición de sonda |
| DELETE | `/api/sondas/{id}` | Baja de sonda (borrado físico — ver pendientes) |
| GET | `/api/sondas/{id}/historico?rango=dia\|semana\|mes\|6meses\|anio` | Serie histórica para la gráfica |
| GET / POST | `/api/usuarios` | Listar / crear usuarios |

## Perfiles y base de datos

| Perfil | Base de datos | Uso |
|---|---|---|
| `dev` (por defecto) | H2 persistente en archivo + `DevDataSeeder` | Desarrollo local |
| `prod` | SQL Server `BD_Pozos_Yaqui` (la entrega Tecnologías) | Producción |

Para producción: `SPRING_PROFILES_ACTIVE=prod` y las variables `DB_URL`, `DB_USER`, `DB_PASSWORD`.
En `prod` Hibernate corre con `ddl-auto: validate`: **nunca modifica el esquema de TI**. Cuando se reciba el esquema real, solo hay que ajustar las entidades en `backend/.../model/` (nombres de tabla/columna).

## Seguridad

- La API Key de Google Maps vive en `frontend/.env.local` (ignorado por Git). Restríngela por referente HTTP en Google Cloud Console.
- Las contraseñas se guardan con BCrypt; nunca en texto plano.
- Los datos semilla y usuarios de prueba solo existen en el perfil `dev`.

## Estado actual y pendientes

Implementado: login básico, mapa con marcadores y alerta por umbral, CRUD de sondas, historial con filtros de día, semana, mes, 6 meses y año, alta de usuarios (API). Datos de desarrollo persistentes y ficticios.

**Alcance de la iteración 0.2:** persistencia local de H2, semilla histórica para distintas escalas y filtros día/semana; se conservan los filtros anteriores. No se ha implementado todavía la consolidación mensual de todo el Valle del Yaqui, ni la autenticación mediante JWT / control de roles. Los usuarios de ejemplo no son adecuados para un despliegue público.

Pendiente (ver `docs/Backlog`):
- **Autenticación real** (JWT + roles, HU-03 / RNF-03): hoy el login no emite token y los endpoints no están protegidos.
- **Esquema real de `BD_Pozos_Yaqui`**: ajustar entidades cuando TI lo entregue.
- **Umbral de alerta**: hoy es 20 m (`deeptrack.alerta.umbral-metros`), falta confirmarlo con el negocio.
- **Borrado de sondas**: decidir entre borrado físico o desactivación (`INACTIVA`) para conservar histórico.
- **Pantalla de gestión de usuarios** en el frontend (listar / editar / desactivar).
- **Exportación de reportes** (RF-06, fase 2).

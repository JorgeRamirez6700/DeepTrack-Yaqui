# DeepTrack Yaqui

Aplicación web para el monitoreo de la profundidad de pozos del Valle del Yaqui: mapa interactivo de sondas (Google Maps), consulta de lecturas y gráficas de tendencia histórica.

## Requisitos

| Herramienta | Versión |
|---|---|
| JDK | 17 o superior |
| Maven | 3.9+ |
| Node.js | 18 o superior |

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

- Las contraseñas se guardan con BCrypt; nunca en texto plano.
- Los datos semilla y usuarios de prueba solo existen en el perfil `dev`.


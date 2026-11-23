# Iteración 0.12 — Auditoría de rendimiento y mantenimiento

## Hallazgos verificados en el código (antes de la intervención)
1. **N+1 en `GET /api/sondas`:** `SondaService.listar()` realizaba `findAll()` y luego `findFirstByIdSondaOrderByFechaHoraDesc` para cada sonda. Complejidad en viajes a BD: **1 + N**. Se reemplaza por `findAll()` y **una consulta de últimas lecturas** mediante JPQL con desempate por fecha e identificador; ahora son **2 consultas**, si hay sondas. Mantiene DTO y alertas.
2. **Carga inicial del navegador:** `App` importaba `Dashboard` (incluyendo mapa y gráficas), incluso sin sesión iniciada. Se cambia a `React.lazy` + `Suspense`, y las pantallas de estadísticas, reportes y usuarios también se descargan al usarse.
3. **Renders redundantes:** el arreglo de sondas filtradas y las opciones del mapa se recreaban ante actualizaciones ajenas. Se agrega `useMemo`, y `MapView` se encapsula con `memo`; esto reduce trabajos innecesarios, sin garantía de mejora cuantificada.
4. **Spring Boot 3.3.4** desfasado: se pasa a 3.5.16, versión 3.x compatible con Java 17, validada por Maven CI. Para salto a Spring Boot 4 se requiere una migración separada.
5. **Dependencias JS antiguas:** Recharts 2 ya no recibe actualizaciones y Vite 5 está obsoleto; actualizadas las declaraciones a Recharts **3.10.1**, Vite **8.3.8** y `@vitejs/plugin-react` **6.3.0**, manteniendo React 18 y Google Maps existentes para contener el alcance. Requiere Node **20.19+** (también compatible con Node 22.12+). Se valida mediante instalación y build de CI, pero requieren revisión visual de Recharts 3 y mapas. No se crea lockfile en este paso: aún hay que generar `package-lock.json` reproducible y migrar de `npm install` a `npm ci`.

## Comprobaciones de integridad
- Tests unitarios para serie vacía, lecturas ausentes y una sola consulta por lote; test JPA/H2 confirma última lectura y retiro/reactivación.
- `mvn clean verify` y `npm run build` en GitHub Actions. Estas verificaciones no miden latencia real ni tiempos de interacción del navegador.
- Pruebas manuales pendientes: Lighthouse/Performance en login frío vs caliente, mapa con 5 y 500 sondas, navegación entre secciones y cambios de tema, DevTools Network, visitas a reportes y salida CSV.
- CI Java17 y Node20 reciente (20.19+); Java17 es compatible con Boot 3.5.16. Revisar Node local antes de instalar Vite 8. Verificar otras plataformas antes de actualizar a Boot 4.

## Riesgos pendientes
- Los agregados históricos siguen filtrando por estado activo actual y agregan las lecturas en memoria; para grandes volúmenes hay que implementar una consulta agregada por sonda/mes optimizada en SQL con índices verificados.
- La consulta de últimas lecturas usa JPQL portable; el plan de ejecución debe medirse en SQL Server real con datos representativos.
- No se han probado Microsoft SQL Server ni Google Maps sobre un navegador real en esta revisión.
- La API Google Maps y ciertos componentes pueden tener rutas de migración que requieren `mapId` y revisión del proveedor, no deben sustituirse sin una prueba funcional.
- **Mantener el PR en borrador** hasta probar los cambios en navegador y el rendimiento real.

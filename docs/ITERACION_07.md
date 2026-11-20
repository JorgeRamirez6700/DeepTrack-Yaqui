# Iteración 0.7 — Rediseño visual, temas y navegación

## Diseño
- Paleta DeepTrack conservada: azul petróleo/verde azulado. Tema claro suave y tema oscuro gris carbón azulado (no negro puro).
- Modos `Claro`, `Oscuro` y `Sistema`, con preferencia persistida en `localStorage` por navegador.
- Escucha cambios de apariencia del sistema cuando está elegido el modo automático.
- Barra lateral plegable en escritorio, menú superpuesto en pantallas pequeñas y cinco secciones independientes.
- Estilos de botones, tarjetas, tablas, inputs y modales coherentes, con estados de foco visibles, respuesta rápida y respeto a `prefers-reduced-motion`.
- Gráficas de Recharts adaptadas a la paleta; Google Maps con estilo oscuro cuando corresponde.
- Inicio de sesión con botón para cambiar tema.
- Estilos de impresión preservados para el reporte mensual; PDF se obtiene mediante `Imprimir → Guardar como PDF`.

## Navegación
1. **Inicio**: tarjetas de indicadores, resumen del valle y mapa con sondas.
2. **Mapa de pozos**: mapa y administración de sondas según rol.
3. **Estadísticas**: resumen del valle y gráfica mensual.
4. **Reportes**: selección de año/mes, CSV y salida para impresión.
5. **Configuración**: selector detallado de apariencia y explicación de preferencias.

Las secciones cambian localmente sin crear nuevas rutas ni alterar los endpoints; el login y roles siguen controlados por Spring Security.

## Pruebas manuales sugeridas
- Cambiar Claro/Oscuro/Sistema desde Login y desde Configuración; recargar y verificar persistencia.
- Cambiar el tema del sistema con modo Sistema seleccionado y verificar reacción.
- Plegar sidebar, recargar y comprobar que se conserve.
- Redimensionar a 390 px, abrir y cerrar el menú móvil, navegar entre todas las secciones.
- Verificar colores y legibilidad de gráfica individual, tendencia mensual, mapa, tabla, modales y estados de error.
- Comprobar que usuarios CONSULTA/DIRECTOR no vean acciones de edición.
- Abrir Reportes, generar vista de impresión en tema oscuro y comprobar que la hoja sea blanca.
- Navegar solo con teclado, comprobar el foco y preferencia de movimiento reducido.

## Pendientes / limitaciones
- GitHub Actions compila frontend y ejecuta tests backend; **no sustituye una revisión visual real** en navegadores/móviles.
- La visualización depende de una clave autorizada de Google Maps; probar con la configuración local.
- Sin rutas profundas (URL por sección) ni gestión avanzada de usuarios en la interfaz.
- El dato y umbral de alerta siguen siendo de desarrollo; no se usan datos institucionales.
- Esta iteración se basa en la 0.6, que se basa en las ramas 0.5, 0.4 y 0.3. Fusionar respetando dependencias.

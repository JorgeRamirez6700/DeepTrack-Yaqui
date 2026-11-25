# Iteración de QA — Issues #9 y #10

## Filtros (#10)
Se conservan dos criterios sencillos e independientes: **estado** (ACTIVA, INACTIVA, MANTENIMIENTO, RETIRADA) y **condición de lectura** (Todas, Normal, Alertas, Sin datos).
- Normal / Alertas / Sin datos consideran **solo** dispositivos ACTIVOS.
- Todas incluye los estados no activos, con lectura previa accesible para consultar su histórico.
- Combinar condición y estado hace una intersección: RETIRADA + Normal no muestra resultados. Restablecer filtros permite recuperar la lista completa.
- Los filtros del mapa y del listado comparten la misma función pura y pruebas con Node.js en CI.

## Lecturas negativas (#9)
El campo `profundidadActual` se conserva por compatibilidad, pero una lectura negativa solo tiene sentido como **valor firmado respecto a una referencia física acordada**. No se cambia el esquema para la base institucional sin una decisión sobre el datum.
- Se elimina la restricción de lectura >= 0 introducida inicialmente como solución provisional.
- Las estadísticas y reportes incluyen todos los valores **finitos** con ambos signos, evitando descartes silenciosos.
- La interfaz indica que la lectura puede tener signo, habilita valores negativos y aclara que la interpretación depende de la referencia.
- Los algoritmos actuales de alertas comparan `lectura > umbral` (20 m en desarrollo). No infieren situaciones de riesgo a partir de valores negativos, pues eso requiere criterios hidrológicos específicos.
- **Pendiente antes de datos reales:** especificar sensor, cero de referencia, convención de signos, unidades y límites; idealmente modelar nivel relativo y profundidad bajo la superficie como magnitudes distintas.
- La siguiente ronda de bugfixes rechaza valores no finitos en el servicio antes de modificar datos. Los límites físicos y la convención de signos quedan pendientes de las especificaciones del sensor.

## QA
- Reproducir manualmente ambos problemas con sondas ficticias.
- Probar Normal / Alertas / Sin datos / Todas, con y sin filtro de estado, búsqueda por cuadrante/ID, y verificar coincidencia de pines y lista.
- Crear sonda ACTIVA ficticia con lectura -2.3; comprobar mapa/lista, tendencia, resumen y reporte mensual. Registrar otra lectura positiva y revisar el promedio.
- CI debe aprobar `npm test`, `npm run build` y `mvn clean verify`.
- No se realizó prueba real con SQL Server institucional ni sensores físicos.

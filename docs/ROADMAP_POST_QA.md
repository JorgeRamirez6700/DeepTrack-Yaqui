# DeepTrack Yaqui — Roadmap posterior a QA
Fecha: 25 de noviembre de 2026. Propuesta de trabajo, no compromiso de alcance.

## Referencias y método
- SRS v0.1, «Especificación de Requisitos de Software - Entregable Semana 1», §§1.2–1.5, 2.3–2.8, 3.1–3.2 y 5.
- «Backlog-Historias de Usuario» v0.1, épicas 1–6, HU-01 a HU-18.
- «Documento de Arquitectura Técnica - Entregable Semana 1» v0.1, §§2–3: presentación → REST/HTTPS → Spring Boot → JDBC/SQL Server.
- Diagrama de despliegue: representación textual del SRS §2.6; casos de uso: RF-01 a RF-07 en SRS §3.1. No se dispone de los diagramas gráficos originales por separado en los archivos consultados.
- Estado contrastado con código y documentación de dev (119cfb5 como punto de partida). El estado del prototipo original no equivale al de la rama actual.

## Estado de alcance
| Requisito | Estado actual en dev | Siguiente brecha |
|---|---|---|
| RF-01 / HU-01–04 | Login, logout, BCrypt, sesiones, alta administrativa | HTTPS real; confirmar decisión de no autorregistro y matriz de roles |
| RF-02–03 / HU-05–07 | Mapa, hover, umbral de ejemplo, filtros | Umbrales de negocio; mapa activo vs históricos; medir RNF-08 |
| RF-04–05 / HU-08–09 | Histórico H2, rangos, gráfica | Fuente SQL Server real, tiempos RNF-09, caso offline |
| RF-06 / HU-16 | Reporte consolidado CSV e impresión | Exportar la gráfica y datos de una sonda en PDF/Excel; confirmar formato |
| RF-07 / HU-13–15 | Alta, edición, desactivación y revocación | Auditar permisos y trazabilidad |
| HU-10–12 | Gestión de sondas y retiro lógico | Decidir alcance de escritura contra BD institucional; estado temporal |

## Orden recomendado
1. **Base real y contrato de medición (Alta, RF-02–05 / HU-08–09; SRS §§2.7–2.8, 5).** Obtener esquema, muestras anonimizadas, fechas, unidades y referencia de medición; acordar permisos JDBC y fuente única, sin migración ni duplicación. Validar SQL Server en entorno autorizado de solo lectura; separar metadatos y telemetría de operaciones de prueba. La definición SRS de profundidad (superficie a espejo de agua) no equivale automáticamente a un nivel firmado. No activar escritura ni modificar esquema institucional sin autorización.
2. **Exportación individual (Media, RF-06 / HU-16).** En la vista de tendencia, generar datos y gráfica del mismo rango seleccionado; ID, cuadrante, fechas, unidades, referencia, cobertura y fecha de generación. Confirmar PDF y Excel (.xlsx) con el usuario; el CSV consolidado actual no satisface por sí solo HU-16. Sin datos: mensaje claro. Verificar fidelidad de negativos finitos. Esta es la primera feature realizable con H2 mientras TI prepara acceso.
3. **Alertas y semáforo avanzado (Media, RF-02 flujo C / HU-06; SRS §1.5).** Definir umbrales superior/inferior con hidrólogo; distinguir normal, alerta, sin datos y lectura antigua. No confundir estado de dispositivo con condición de medición. Propuesta: hora de última lectura y aviso de datos atrasados; requiere frecuencia esperada acordada. No inventar reglas de riesgo.
4. **Auditoría y control de acceso (RNF-04, RNF-03, RF-07).** Registrar actor, acción, fecha, objeto y resultado en cambios de sondas/usuarios; acceso de administrador, sin passwords ni tokens. Acordar retención; reconciliar Director/Consulta y alcance de pozos asignados con perfiles SRS §2.4. Propuesta: historial de cambios de estado con fechas, para agregados históricos reproducibles (limitación docs/ITERACION_11.md).
5. **Desempeño y operación (RNF-05, 07, 07b, 08, 09, 12, 14).** Medir mapa <3 s e histórico+gráfica <=2 s en condiciones acordadas; pruebas de red lenta y navegadores, datos numerosos, índices y consultas. Preparar HTTPS, respaldos/recuperación con TI y monitoreo 24/7; no declarar objetivos cumplidos sin evidencia. Propuesta: E2E con loader simulado y Playwright, migración controlada de marcadores cuando convenga.
6. **Futuro:** RNF-06 preparación para múltiples distritos (sin comprometer primera entrega); HU-17 predicción y HU-18 correo automático son baja prioridad, fuera del MVP por SRS §1.5. No comenzar hasta validar telemetría y prioridades.

## Cierre de QA y decisiones
- #9: negativos finitos conservados en dev; rechazo no finitos, CSV numérico. Mantener abierto hasta aprobar interpretación física, compatibilidad real y QA manual.
- #11: step any, validación numérica; #12: solo petición vigente actualiza datos; #14: estado omitido conserva el anterior, reactivación explícita. Validar manualmente antes de cerrar.
- #10 y #13 cerrados; no reabrir sin regresión reproducida.
- Sin cambios de esquema, dependencias ni main. La próxima entrega de feature debería concentrarse en HU-16 mientras se resuelve la dependencia de TI.

# Iteración 0.9 — Navegación y accesibilidad

Rama persistente `dev`, creada desde el último commit de 0.8 (pendiente de integración en main). Dos commits de 0.9. CI se ejecuta en main y dev, y PR hacia main.

Cambios: secciones mediante fragmentos URL, navegación atrás/adelante, acceso directo al contenido, etiquetas accesibles de navegación, Escape y gestión de foco en modales, validación de campos según límites existentes, animación breve respetando movimiento reducido, mapa sin información obsoleta al filtrar y estado sin datos coherente.

Validación manual: recargar #reportes, usar atrás/adelante, navegar con Tab, cerrar modales con Escape y comprobar retorno del foco; recorrer menú móvil, revisar ambos temas, activar movimiento reducido, filtrar marcadores y comprobar sondas sin lectura. CI no reemplaza estas pruebas en navegador. No se modifican permisos ni backend.

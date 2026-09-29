# Auditoría responsive — 29/09/2026

## Resultado

Se revisó la estructura React/Vite, el CSS responsive, navegación, formularios, servicios, recorrido de vídeo y la evidencia Playwright incluida en el proyecto.

- Matriz responsive incluida: 30/30 configuraciones aprobadas, de 320×568 a 3440×1440, incluyendo puntos de corte y zoom 125/150/200 %.
- Sin overflow horizontal registrado en esa matriz.
- Sin excepciones de página registradas en esa matriz.
- Suite de navegador incluida: 32 pruebas esperadas, 0 inesperadas y 0 flaky; 4 pruebas saltadas por limitaciones específicas de motor/hardware.
- Pruebas unitarias que no requieren dependencias externas, reejecutadas en esta auditoría: 25/25 aprobadas (servidor de contacto + puerta del vídeo).

## Corrección aplicada

Se compactó el menú únicamente en viewports de poca altura (`max-height: 540px`). En móvil apaisado, la evidencia anterior mostraba que el menú dependía de scroll interno para revelar todas las opciones. Ahora se reducen margen, padding y escala tipográfica solo en esas alturas para que las ocho entradas quepan de forma visible.

Se comprobó la geometría de esa corrección en Chromium para 844×390, 640×360, 1024×540 y 320×568: la última opción queda dentro del área visible en todos los casos.

## Limitación del entorno de esta ejecución

El sandbox actual no pudo resolver `registry.npmjs.org`, por lo que no fue posible reinstalar las dependencias del ZIP y arrancar una nueva build Vite completa. El navegador integrado en la nube tampoco puede acceder al `localhost` del contenedor. Por ello no se presenta una nueva ejecución end-to-end de toda la v13 como si se hubiera realizado.

La revisión visual se apoyó en las capturas y resultados Playwright que ya acompañan al proyecto, y la corrección nueva se validó en Chromium con un escenario de geometría equivalente del menú.

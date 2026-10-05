# SYKR4 — FINAL V1

Esta entrega consolida la versión de producción de SYKR4 con la dirección visual de la versión inmersiva original. Conserva el contenido actual, el recorrido de vídeo, el astronauta 3D, los servicios, casos, métricas, equipo, contacto y la preparación para GitHub Pages.

## Qué se ha corregido

- Hero reconstruido para recuperar la jerarquía editorial original: titular protagonista y HUDs flotantes únicamente en escritorio grande.
- Responsive del Hero simplificado; se eliminó la columna fija de 260 px que comprimía el contenido.
- Servicios: narrativa horizontal fijada en escritorio con puntero desde 1024 px, sin depender de una altura mínima; en móvil/tablet pasa a una cuadrícula/flujo normal y deja de forzar una pista horizontal de ~84vw por tarjeta.
- Endurecimiento responsive en casos, contacto, vídeo, menú y viewports de poca altura.
- Vídeo del recorrido mantiene 1280×720, H.264 y 24 fps, pero se ha recomprimido de ~43 MB a ~21 MB, con `faststart` y `preload="metadata"`.
- En móvil el vídeo conserva `object-contain` para no recortar el contenido, con un fondo ambiental desenfocado para evitar grandes barras negras visualmente vacías.
- El astronauta 3D se mantiene con su carga diferida y preview; además, el presupuesto general WebGL se ha reducido para evitar empezar con una carga excesiva.
- Partículas: 24k/10k/4k según perfil y DPR máximo 1.5/1.25/1; el LOD adaptativo existente puede bajar todavía más si caen los FPS.
- La composición de Equipo se compacta ligeramente en móvil sin eliminar el contenido de producción.
- Navegación directa a Contacto: todos los CTA que apuntan a `#contacto` atraviesan el recorrido sin activar la captura del vídeo, igual que «Volver arriba» lo omite en sentido contrario. El scroll manual sigue activando el recorrido normalmente.
- Se conserva comentada la línea del overlay `Cargando el recorrido…`, tal como se pidió en la revisión anterior.

## Validación incluida

Pruebas puras que no requieren instalar dependencias (33 comprobaciones en esta revisión):

```bash
npm run test:final
```

También se conserva la suite completa del proyecto:

```bash
npm ci
npm run check
npm test
npm run build
npm run test:browser
```

La entrega fue auditada contra las dos webs públicas. La referencia antigua confirma que el Hero editorial y el flujo de servicios sin carrusel horizontal en móvil eran parte de la experiencia que funcionaba mejor. La producción confirmó el contenido y las capacidades nuevas, y puso de manifiesto el coste del vídeo/3D y el letterboxing móvil.

### Limitación del entorno de entrega

El entorno donde se preparó este ZIP no pudo resolver `registry.npmjs.org` (`EAI_AGAIN`), por lo que no fue posible reinstalar Vite/React/Playwright y ejecutar aquí la suite que depende de `node_modules`. Para no ocultarlo, se añadieron pruebas estáticas específicas y se ejecutaron las pruebas de lógica que funcionan sin dependencias. En un entorno normal con acceso al registro, los comandos de arriba son la comprobación final reproducible.

## Desarrollo local

Requiere Node según `package.json`.

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

## Producción y contacto

El frontend usa `/api/contact`. Para envío real hay que configurar las variables descritas en `.env.example`. Un hosting puramente estático no ejecutará el backend Node incluido; la parte visual sí sigue preparada para la raíz de `sykr4.com`/GitHub Pages según `vite.config.ts`.


La documentación de `docs/` que menciona v10-v13 se conserva únicamente como histórico. Para esta entrega prevalecen `README_FINAL_V1.md`, `AUDITORIA_FINAL_V1.md` y `docs/FINAL_V1_TEST_RESULTS.txt`.

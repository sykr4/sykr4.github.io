# Auditoría de entrega — SYKR4 FINAL V1

Fecha: 2026-09-29

## Objetivo

Conservar las funciones y el contenido de la versión productiva, recuperar la calidad visual de la versión inmersiva original y reducir regresiones de responsive y rendimiento sin eliminar el vídeo nuevo ni el astronauta 3D.

## Hallazgos de las dos versiones públicas

### Referencia inmersiva
- El Hero tenía una jerarquía editorial más fuerte: tipografía muy grande y HUDs flotantes.
- En 390 px no había overflow horizontal de página.
- Los servicios se resolvían en flujo vertical en móvil.
- El recorrido de vídeo era mucho más corto y ligero.

### Producción v13
- Conserva más contenido y funcionalidades, incluido astronauta 3D y vídeo de 76.17 s.
- En el navegador de auditoría, el vídeo mostró una vez un fallo recuperable de primera carga.
- El astronauta puede tardar varios segundos en hidratarse, aunque su carga diferida y fallback funcionan.
- En móvil los servicios estaban en una pista horizontal ancha y el vídeo 16:9 mostraba letterboxing negro considerable.
- La carga visual simultánea de partículas, vídeo y Three.js incrementa la presión de GPU/medios.

## Cambios FINAL V1

1. Hero
   - Recuperada escala de hasta 8.2rem.
   - Eliminada la columna HUD fija de 260 px.
   - HUDs decorativos pasan a posicionamiento flotante solo en `xl`.
   - Móvil prioriza título, texto y CTA; no renderiza los HUDs decorativos.

2. Servicios
   - Escritorio fijado a `(min-width: 1024px) and (hover: hover)`.
   - Eliminada la dependencia de `min-height: 780px` que mandaba portátiles bajos al layout móvil.
   - Móvil/tablet usa grid/flujo normal en lugar de una pista horizontal forzada.
   - Textos largos se limitan visualmente en tarjeta; el detalle completo sigue disponible en el diálogo.

3. Recorrido
   - `preload="metadata"` en vez de `auto`.
   - Umbral de precarga reducido de 150% a 100% de distancia.
   - Vídeo recompreso de ~43 MB a ~21 MB, mismo tamaño 1280×720, 24 fps y duración 76.17 s.
   - Fondo ambiental desenfocado solo en móvil para suavizar el espacio sobrante sin recortar el vídeo.

4. Responsive
   - Reglas de `min-width:0` y wrapping en casos/contacto/servicios.
   - Ajustes específicos para móvil y viewports de poca altura.
   - Se mantienen los mecanismos de navegación, menú y gate del vídeo.

## Pruebas ejecutadas

### Unitarias/lógica sin dependencias externas
Comando:

```bash
node --experimental-strip-types --test tests/videoGate.test.ts tests/contactServer.test.ts tests/layoutFinal.test.mjs
```

Resultado en esta revisión: **33/33 correctas, 0 fallos**.

Cobertura funcional de estas pruebas: máquina de estados/gate del vídeo, navegación y reversa del recorrido, reentradas y resize, validación/servidor del formulario de contacto y nuevas garantías de layout/rendimiento de FINAL V1.

### Parseo de TypeScript/TSX
Se transpilaron sintácticamente todos los `.ts`/`.tsx` de `src`, `server` y `tests` (excepto declaraciones `.d.ts`) con el TypeScript disponible globalmente.

Resultado: **41 archivos, 0 errores de parseo/transpilación**.

### Medios
- Vídeo final: H.264, 1280×720, 24 fps, 76.17 s, ~21 MB, con GOP corto para rebobinado fluido.
- Se verificó visualmente un frame comparativo tras la recompresión; no se detectaron artefactos graves.
- El GLB del astronauta se conserva sin recomprimir para no introducir una regresión visual no validada.
- Presupuesto WebGL reducido de 32.000/15.000/6.000 partículas a 24.000/10.000/4.000 y DPR máximo de 1,75/1,5/1 a 1,5/1,25/1.
- Los HUD decorativos del Hero dejan de ejecutar parallax cuando están ocultos y el scroll del Hero respeta `prefers-reduced-motion`.

### Navegador público
Se auditaron visualmente las dos URLs públicas en escritorio y móvil mediante navegador remoto. Esa auditoría confirmó la dirección que se recupera de la referencia y los problemas de producción que se corrigen aquí.

### QA visual dirigido de FINAL V1
Como la build Vite no podía regenerarse sin `node_modules`, se creó un harness estático de las secciones realmente modificadas y se renderizó con Chromium/Playwright en 1440×900, 1024×600, 768×1024, 390×844 y 320×568. Se inspeccionaron Hero, Servicios y el tratamiento móvil del vídeo. En las cinco geometrías el ancho del documento coincidió con el viewport y no hubo errores de consola. El harness se usó como control visual dirigido y no se presenta como sustituto de una ejecución E2E de la app compilada.

## Limitación verificable

La red del contenedor no pudo resolver `registry.npmjs.org` (`EAI_AGAIN`). Por ese motivo no fue posible restaurar `node_modules` y ejecutar localmente en esta sesión `vite build`, el typecheck con resolución completa, los tests jsdom/React ni Playwright contra el código FINAL V1. No se declara que esos pasos hayan pasado.

La entrega conserva `package-lock.json`, los tests originales y los nuevos tests. En una máquina con acceso normal a npm se debe ejecutar:

```bash
npm ci
npm run check
npm test
npm run build
npm run test:browser
```


## Revisión 2026-10-02 — bypass de Contacto

- Todos los CTA que resuelven a `#contacto` usan ahora la misma idea de transacción directa que «Volver arriba», pero en sentido descendente.
- La transacción resetea una captura de vídeo activa, salta físicamente a Contacto y vuelve a muestrear el destino antes de que lleguen eventos `scroll` pendientes.
- La puerta del vídeo consulta `isBypassingVideo()` para ignorar únicamente esa navegación explícita. Rueda, touch, PageDown/End y scroll normal siguen capturando el recorrido.
- Se conserva comentada la línea del overlay `Cargando el recorrido…`.
- Suite sin dependencias externas: 33/33. Parse sintáctico TS/TSX de `src/`, `server/` y `shared/`: 38/38. La instalación de dependencias volvió a quedar bloqueada por acceso al registro, por lo que no se presenta una ejecución Playwright de esta revisión como si se hubiera realizado.

> HISTÓRICO: describe una versión anterior. La referencia de contenido vigente es `docs/COPY_FINAL_V11.md`. Las capturas y resultados v10 no verifican la maquetación v11.

# SYKR4 · revisión final v10

Revisión realizada el 25–26 de septiembre de 2026 sobre `/home/kike/Downloads/SYKR4_WEB_v9`. La carpeta y `README_ENTREGA.md` identificaban la base como v9. No había repositorio Git. Se conservó una copia inicial en `/tmp/sykr4-v9-original-SVczCS` y se trabajó sobre los archivos existentes, sin restauraciones ni sustituciones por otra versión.

**No se ha publicado en producción ni enviado correo real.** El proyecto queda implementado y preparado para revisión. La conexión real del receptor depende de datos que no se han facilitado.

## Fallos y correcciones

| Punto | Causa comprobada | Cambio y evidencia |
|---|---|---|
| Widget sobre el CTA | En `Hero.tsx`, «200+ / Servidores» usaba `bottom:19%; right:31%` en una capa absoluta. A 1280×720 invadía aproximadamente 55×19 px del CTA. | HUD integrado en la distribución mediante grid, con fila independiente para las acciones; tamaños adaptables y parallax acotado. Se conservan ambas tarjetas. Nueve puntos de hit-testing dentro del CTA, geometría sin intersección y clic real comprobados. |
| «Volver arriba» atrapado | `Footer.tsx` llamaba al desplazamiento normal de Lenis; la captura detectaba el cruce ascendente. | Acción específica, inmediata y síncrona. Pausa el vídeo, libera únicamente su bloqueo, fija el inicio y actualiza la posición observada antes de los eventos de scroll pendientes. El estado transitorio termina en `finally`; no hay un temporizador de bypass que pueda quedar activo. Hay regresiones desde reproducción parcial, desde abajo, con excepción y con tres ciclos sucesivos. |
| Óvalo central | Un `<p role="status">` vacío conservaba `padding:12px 20px`, fondo oscuro y radio redondo: **40×24 px**. Es HTML, no un defecto del MP4. | `.vs-load-status:empty { display:none }`. Sigue apareciendo el mensaje cuando realmente carga. Se contrastaron las capas superpuestas, el vídeo dibujado directamente en canvas y una captura de la web. MP4 intacto; no se ha eliminado el defecto mediante recorte. |
| Título del recorrido tapado | Intro absoluta `z-0` bajo el vídeo `z-10`, dentro del mismo contenedor sticky; dependía de una máscara y desaparecía al abrirse la escena. | Título en flujo normal antes de la sección capturada, separación moderada y previa del vídeo alineada arriba para evitar un gran hueco en vertical. Sticky reservado para el recorrido. |
| Recarga / cambio de tamaño | La inicialización anterior forzaba el scroll a cero. La restauración nativa con contenido React y cambios de tamaño no conservaba siempre la sección. | Conservación relativa a la sección y restauración tras preparar fuentes/layout; una recarga dentro del vídeo vuelve a capturar una visita nueva. Redimensionar una visita activa conserva su progreso. |
| Anclas y CTA | La captura detenía la animación de desplazamiento y se perdía el destino solicitado. | La navegación normal sigue capturando el vídeo y continúa hacia su destino cuando termina. Un nuevo gesto manual cancela ese destino pendiente. Solo el botón del pie usa la excepción directa. |
| Menú pequeño y teclado | Tipografía vinculada principalmente a altura, con rótulos recortados en móviles; faltaba encerrar el foco del menú. | Tamaño limitado también por ancho, área interna con altura mínima cero y scroll, ciclo de Tab/Shift+Tab, Escape y devolución del foco. Bloqueo con propietario independiente y limpieza al desmontar. |
| Otros detalles a 320 px | El ancho mínimo de la cuadrícula de aplicaciones, su fila de métricas, el wordmark del pie y el título «automatización» en tarjeta/ventana de detalle podían exceder su espacio. | `min-width:0`, métricas con salto de línea, wordmark adaptable y títulos ajustados. Se revisaron las cinco ventanas de detalle en cuatro anchos adicionales. No se han sustituido contenidos. |
| Formulario sin envío real | Solo había opciones de TXT/mailto o endpoint externo sin backend configurado. | API de servidor incluida, integración Resend, validación compartida, prevención de duplicados, límites y errores claros. La ruta por defecto intenta un envío real; sin configuración muestra indisponibilidad y responde 503. |

El HUD original ya llevaba `pointer-events:none`: el fallo reproducido era visual. En la distribución final tampoco se detectaron capas transparentes interceptando los puntos comprobados del botón.

## Contenido y recursos conservados

`src/data/content.ts` coincide con la copia inicial: IA y automatización; AWS, cloud y costes; Seguridad y Microsoft 365; Desarrollo e integraciones; Web y ecommerce. Se mantienen las cinco tarjetas y cinco rótulos, además de la opción de orientación del formulario.

El MP4 sigue teniendo 76,167 s y seis planetas: los cinco servicios y la llegada final. El astronauta y contacto siguen inmediatamente después. No se han modificado el MP4, GLB ni el motor original del astronauta.

| Recurso | SHA-256 verificado contra v9 |
|---|---|
| MP4 | `ef86d85257cdab8b703c2979cef2ed59f01ca2c2a7d4e9259b31a877a24dbe64` |
| GLB V4 | `1881085722f3d462d6ba6ead6698dd6bfb447a61f21b42789df555818dea8083` |

Se comprobaron carga y renderizado WebGL y los clips `Idle`, `Wave_One_Hand`, `Wrist_Check`, `Military_Salute`. En observación sin pulsar «Probar gestos» apareció el saludo inicial y el contador de gestos automáticos alcanzó 1 con `action:wrist`, a 18,6 segundos activos del motor. La siguiente acción programada seguía siendo `military`. La grabación y el JSON conservan esta evidencia. No se ha observado físicamente todo el ciclo automático de larga duración; su lógica permanece cubierta por las pruebas existentes del motor.

## Pruebas en navegador y revisión visual

Acceso local resuelto mediante Playwright instalado en la misma máquina. Vite se ejecutó en `http://127.0.0.1:4175` porque 5173 ya estaba ocupado; no se detuvo ese proceso previo. También se ejecutó la compilación con el servidor Node en `http://127.0.0.1:4176`. No fue necesario publicar la web para probarla.

Se utilizaron motores reales **en modo headless**, con capturas inspeccionadas visualmente. Esto es distinto de las pruebas con DOM simulado y también de una prueba en hardware físico.

| Motor | Alcance |
|---|---|
| Chromium 153.0.8010.12 | Matriz responsive completa, ratón, teclado, barra nativa, tacto por CDP, vídeo/3D, formulario y grabación. |
| Firefox 155.0 | Casos comunes de scroll, retorno, errores, preferencias, menú, CTA y formulario; capturas de la compilación a 1280×720. |
| WebKit 26.6 en Linux | Mismos casos comunes y capturas de la compilación a 1280×720. No equivale a Safari en un iPhone o Mac físico. |
| Google Chrome 146.0.7680.153 | Reproducción inicial de v9 y capturas anteriores al cambio. |

WebKit necesitó `libavif16`, `libgav1-1` y `libyuv0`, extraídas en `/tmp` para esta sesión. No se modificaron paquetes del sistema. En otro equipo Linux se pueden instalar las dependencias mediante `npx playwright install-deps`.

### Matriz ejecutada

| Grupo | Tamaños CSS |
|---|---|
| Móvil vertical | 320×568, 360×800, 390×844, 430×932 |
| Horizontal | 844×390 |
| Tableta | 768×1024, 1024×768 |
| Portátil | 1280×720, 1366×768 |
| Escritorio | 1440×900, 1920×1080 |
| Ancha | 2560×1440, 3440×1440 |
| Intermedios / breakpoints | 479×800, 480×800, 639×800, 640×800, 767×900, 769×900, 1023×780, 1024×779, 1024×780, 1025×781, 1279×900, 1281×900, 1535×900, 1536×900 |
| Zoom equivalente sobre 1280×720 | 125 %: 1024×576; 150 %: 853×480; 200 %: 640×360, ajustando también DPR |

En las 13 medidas principales y tres de zoom se recorrieron cabecera/menú, inicio/CTA/HUD, manifiesto, servicios, intro, vídeo, contacto/astronauta, errores y texto largo, aplicaciones, resultados, nosotros y pie. En las 14 medidas intermedias se verificaron geometría global y CTA. Se generaron capturas por sección y algunos documentos completos. El scroll horizontal de las tarjetas de servicios y los carruseles decorativos es intencional; no hubo desbordamiento horizontal de página en la matriz final.

**El zoom se ha emulado mediante el tamaño CSS y DPR equivalentes**, no utilizando el menú de zoom de un navegador de escritorio físico. El teclado móvil se aproximó reduciendo la ventana de 390×844 a 390×440 mientras se editaban campos. No equivale al teclado de iOS/Android ni a sus barras dinámicas.

### Casos de interacción

| Caso | Comprobación realizada |
|---|---|
| Rueda lenta / ráfagas | Eventos reales de entrada de Playwright, incluidos saltos de 20 000 px; captura y aceleración posteriores. |
| Trackpad | Deltas pequeños de rueda (8 px), simulación. No había trackpad físico disponible. |
| Táctil rápido | Gestos CDP con desplazamiento de 600 px, repetidos tres veces; reentrada y cambio 390×844 → 844×390. Solo Chromium. |
| Teclado | PageDown, PageUp, espacio, Home, End; teclas de edición no capturan el vídeo. Ctrl+rueda permanece libre para zoom. |
| Barra de desplazamiento | Arrastre de la barra nativa desde arriba atravesando la sección en Chromium. Se verificó también el salto nativo completo con `scrollTo`. |
| Entrada inversa / cambio de dirección | Reentrada desde abajo, rebobinado real, cambio a avance y nuevo rebobinado; salida y nueva visita. |
| «Volver arriba» | Clic real en el pie tras completar el vídeo y reentrada posterior. En estado parcial se invocó el mismo manejador desde el botón fuera de pantalla; tres ciclos y evento de scroll pendiente. |
| Menú / CTA / anclas | Apertura, foco, Tab/Shift+Tab y Escape; detalle de servicio; CTA al contacto con captura previa y llegada al destino; cerrar el menú no libera el bloqueo del vídeo. |
| Resize / recarga | Geometría de captura recalculada sin reiniciar progreso al redimensionar; recarga con restauración dentro de la escena. |
| Preferencias | Movimiento reducido inicial y cambio durante una captura: libera el scroll y deja reproducción voluntaria. |
| Carga fallida o lenta | MP4 abortado, reintento con recurso real y espera superior a 15 s: liberación y formulario utilizable. |
| Formulario | Campos vacíos, formato, texto largo, estados de error, 503 sin configuración, doble envío y aceptación HTTP local. Las pruebas de proveedor utilizan un doble y no envían correo. |

En el recorrido grabado se reprodujo **el MP4 real hasta su final**, acelerándolo mediante rueda, sin saltar su reloj. Para llegar rápidamente a estados terminales en varias regresiones automatizadas se utilizó un seek controlado; esos casos están comentados como tales y no sustituyen la grabación de reproducción real.

No se observaron bloqueos permanentes, pérdida definitiva de captura ni parpadeos en las capturas y el recorrido revisados. Los bloqueos se liberan al fallar, cambiar preferencia o desmontar; los manejadores de rueda, teclado, tacto (incluido cancel), resize, navegación y frames se eliminan. Las promesas de reproducción ignoran finalizaciones posteriores al desmontaje.

## Resultados técnicos

- La base tenía 41 pruebas automatizadas correctas; se han conservado y ampliado.
- **57 pruebas de unidad/integración DOM y servidor correctas**, TypeScript sin errores.
- `npm run build`: completado; HTML autocontenido de unos 1,084 MB (309 kB gzip) más recursos originales externos. Se mantiene la estructura de compilación de la entrega.
- `npm audit` y `npm audit --omit=dev`: **0 vulnerabilidades** después de actualizar Vite de 7.3.2 a 7.3.6. No se hizo una migración de versión mayor.
- **32 pruebas de navegador correctas y 4 omitidas**: [browser-results.json](qa/browser-results.json), generado sobre la compilación servida por Node. Las cuatro omisiones corresponden exclusivamente a los dos ensayos CDP/barra específicos de Chromium en Firefox y WebKit. La última corrección tipográfica de los detalles se verificó aparte con 20 aperturas de servicio en 320, 390, 768 y 1280 px: [resultados](qa/services/results.json).
- El servidor de compilación devolvió 200 para HTML/GLB, 206 con rango correcto para MP4, 404 para `.env.local`, 200 para disponibilidad y 503 honesto para el envío sin configurar.
- Los JSON de QA registran las excepciones, estados de medios y red. Los 503 del formulario son esperados. El aborto de una consulta de disponibilidad al desmontar en desarrollo es una cancelación de ciclo de vida, no una entrega fallida de correo.

La consola de la compilación no registró excepciones de página ni errores de aplicación, pero **sí advertencias**: dos instancias de Three.js (la web y el runtime autocontenido original del astronauta), lecturas de GPU en Chromium con renderizado software y avisos de Firefox sobre detección WebGL y efectos ligados al scroll. No se han ocultado. El contexto usado para detectar WebGL se libera deliberadamente; el renderizado posterior del modelo quedó confirmado en los tres motores. Estas pruebas no constituyen una medición de rendimiento en una GPU física.

La primera prueba de arrastre se ejecutó antes de que el compositor volviera a dibujar la barra tras quitar `overflow:hidden`. Se corrigió el ensayo para esperar su disponibilidad; el arrastre real y su regresión volvieron a pasar. Las correcciones se comprobaron de nuevo sobre la compilación final.

## Evidencias

- [Galería local de capturas](qa/index.html).
- [Inicio anterior 1280×720](qa/before/hero-1280x720.png) y [corregido](qa/responsive/1280x720-hero.jpg).
- [Óvalo en la interfaz anterior](qa/before/video-oval.png), [fotograma directo del MP4](qa/before/original-video-frame.png) y [recorrido corregido](qa/walkthrough/video-without-oval.png). La geometría del elemento responsable está en [baseline.json](qa/before/baseline.json).
- [Móvil](qa/responsive/390x844-astronaut.jpg), [tableta / entrada del recorrido](qa/responsive/768x1024-intro.jpg) y [escritorio](qa/responsive/1440x900-contacto.jpg).
- [Grabación: scroll rápido, retorno y reactivación](qa/walkthrough/scroll-top-reactivation.webm), con [registro de estados y gestos automáticos](qa/walkthrough/results.json).
- [Matriz y hit-testing](qa/responsive/results.json), [consola/red y capturas de compilación por motor](qa/production/results.json).

Las capturas de página completa reflejan el estado de las animaciones en el momento de captura; para valorar cada sección se deben usar las imágenes individuales de la galería.

## Pendiente y alcance real

1. **Conectar el receptor:** destinatario de SYKR4, remitente verificado y clave de Resend, o un endpoint existente equivalente. Configurarlos en el servidor, no compartir secretos en el chat. Falta además el origen/alojamiento de la publicación definitiva. Instrucciones en [README_ENTREGA.md](../README_ENTREGA.md) y [CONTACTO_ASTRONAUTA.md](../CONTACTO_ASTRONAUTA.md).
2. **Comprobar recepción real:** aceptación en el proveedor y llegada a bandeja de entrada/spam son comprobaciones separadas; ninguna se ha realizado con correo real.
3. **Hardware:** no se han probado trackpad físico, iPhone/Android real, teclado virtual del sistema ni zoom nativo de la interfaz del navegador. Tampoco todas las combinaciones navegador/tamaño: la matriz completa se ejecutó en Chromium. No se afirma compatibilidad universal.
4. **Despliegue:** el límite antiabuso en memoria está preparado para una instancia Node. Varias instancias requieren un almacén común/protección en proxy. Un hosting exclusivamente estático necesita una API aparte. No se ha publicado ni decidido el alojamiento.

La entrega es `SYKR4_WEB_v10.zip`, con fuentes, servidor, pruebas, documentación y evidencias, sin `node_modules`, secretos ni ejecutables de navegador. `scripts/package.mjs` genera el ZIP mediante una lista explícita de archivos y añade `MANIFEST_V10.json` con hashes para revisar su integridad.

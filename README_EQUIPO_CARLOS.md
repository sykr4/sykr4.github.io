# SYKR4 · Corrección de Servicios y contacto de equipo

Esta revisión corrige el recorte señalado en las tarjetas de Servicios y actualiza la presentación y el contacto del equipo según las últimas indicaciones.

## Cambios visibles

- Las tarjetas de Servicios conservan todo el texto: se elimina el límite de cuatro líneas y la altura fija dependiente de `70vh`.
- El contenido de las tarjetas no se comprime con flex shrink. Su altura se adapta al texto.
- La navegación horizontal fijada solo se activa con al menos 1024 px de ancho, 820 px de alto y puntero con hover. Además, se mide el alto natural del contenido: si no cabe dejando 96 px libres, se utiliza la retícula vertical. Un ResizeObserver comprueba los cambios de tamaño y de fuentes. Al cambiar la ventana se vuelve a evaluar.
- Se conservan los textos, iconos, colores, detalles de servicio y el enlace «Ver qué incluye».
- Las tarjetas y los perfiles ampliados no muestran las etiquetas «Cofundador» ni «Director de negocio».
- La información visible distingue a cada persona por su especialidad: desarrollo e integraciones; arquitectura y seguridad; clientes y comunicación.
- El teléfono se presenta siempre como contacto del equipo SYKR4. No se describe como el teléfono de Carlos ni como una llamada individual a cada miembro.
- Se ofrecen llamada y WhatsApp al mismo número: **+34 674 09 72 80**.

Destinos:

| Acción | Destino |
| --- | --- |
| Llamada al equipo | `tel:+34674097280` |
| WhatsApp del equipo | `https://wa.me/34674097280` |
| Instagram de SYKR4 | `https://www.instagram.com/sykr4_tech/` |

El enlace de WhatsApp abre la conversación; no envía ningún mensaje automáticamente.

## Equipo y diseño

Se mantiene la integración dentro de «Nosotros», con tres retratos circulares, resumen visible y un botón «Conoce a…» que abre el perfil completo. Se conservan las especialidades y los años de experiencia del proyecto original: Javier, 5 años; Enrique, 10 años. No se atribuyen años de experiencia no facilitados a Carlos.

El titular y el primer texto introductorio originales se conservan, y se ha restituido el párrafo original que empieza «Enrique y Javier dirigen las áreas técnicas…». La función de Carlos se añade en un párrafo separado. Los tres pilares originales mantienen su texto.

Las animaciones nuevas utilizan el GSAP ya instalado. No hay nuevas dependencias, vídeo, canvas o escenas WebGL. Las fotos son las facilitadas, redimensionadas y convertidas a WebP, con 150.766 bytes en total; no se han regenerado las caras.

El diálogo nativo permite cierre con botón, cancelación/Escape y clic exterior; devuelve el foco al botón original. El bloqueo de scroll tiene propietario propio. Las nuevas animaciones atienden la preferencia de movimiento reducido y revierten sus recursos al desmontar. Si una foto falla, permanece un sustituto con iniciales y nombre accesible.

## Alcance sobre el ZIP original recibido

Código original modificado:

1. `src/sections/About.tsx`: presentación de los tres miembros.
2. `src/sections/Services.tsx`: corrección del recorte y adaptación al espacio disponible.

También se ha actualizado `tests/layoutFinal.test.mjs`, una comprobación existente de Servicios, para reflejar el texto completo y la nueva condición de espacio vertical.

Los demás archivos originales conservan sus bytes, según comparación SHA-256. Las fotos, el módulo de perfiles, sus estilos, sus datos y sus pruebas son archivos nuevos respecto al ZIP inicial. La carpeta `dist/` contiene la nueva compilación. El manifiesto de esta entrega registra los cambios respecto al ZIP inicial.

No se modifican portada, navegación, ejemplos, método, vídeo, astronauta, formulario, pie, dependencias ni configuración de despliegue. No se ha publicado ni se ha enviado ningún cambio al repositorio remoto.

## Pruebas y revisión con navegador

Entorno: Node 24.19.0 y el lockfile suministrado.

| Comprobación | Resultado |
| --- | --- |
| `npm run check` | Correcta. |
| `npm test` | 76 pruebas correctas, 0 fallos. |
| `npm run build` | Correcta. |
| Compilación del HTML de vista previa | Correcta. |
| Perfiles y contacto | Pruebas en React/jsdom de apertura, cierre, retorno de foco, cancelación, clic exterior, arrastre desde el interior, foto ausente, desmontaje y StrictMode. |
| Llamada y WhatsApp | Los tres perfiles y el bloque común contienen los destinos del equipo; ausencia de los cargos solicitados y de llamadas personales comprobada. |
| Navegador integrado | Se abrió `https://sykr4.com/` y se inspeccionó el DOM de las tarjetas originales; viewport observado: 1363 × 936. En ese tamaño se midieron 91 px para las descripciones originales limitadas a cuatro líneas. |
| Vista local corregida en navegador | Bloqueada: la navegación al servidor de revisión fue rechazada con `net::ERR_BLOCKED_BY_CLIENT` y la política de URL impidió inspeccionar la página de error. No se intentaron vías para eludir ese bloqueo. |

La diferencia de las capturas y la revisión del código identifican el riesgo de la altura fija y de la compresión de contenido. La corrección elimina ambos mecanismos y añade el control de espacio real. Las pruebas de DOM aíslan GSAP y el diálogo nativo: no acreditan el render visual, el movimiento real ni el comportamiento nativo del foco en un navegador.

La web corregida no se ha podido revisar visualmente en el navegador integrado, ni en móvil físico. No se presenta el diagnóstico sobre la web publicada como una prueba visual de esta versión nueva. El HTML incluido permite revisar Servicios y Equipo antes de publicar.

## Uso

Con Node 24.15.0 o posterior:

```sh
npm ci
npm run dev
```

Para verificar y compilar:

```sh
npm run check
npm test
npm run build
```

`SYKR4_EQUIPO_PREVIEW.html` es una vista aislada de Servicios y Equipo, con el mismo código y estilos. Incluye las fotos embebidas, apertura de perfiles y contacto por llamada/WhatsApp. Las fuentes de Google disponen de alternativa de sistema sin conexión. Su fondo es estático y no pretende verificar el WebGL de la web completa.

## Contrato acotado · build-immersive-websites

Objetivo: corregir el recorte, conservar el contenido original y presentar al equipo sin cargos en las tarjetas, con un contacto corporativo común. Se mantiene la dirección visual y la escena existente; no se añade una escena 3D.

| Necesidad | Recurso de la skill aplicado | Aplicación | Evidencia o límite |
| --- | --- | --- | --- |
| Medios | `references/asset-direction.md` | Retratos locales, dimensiones reservadas, carga diferida y alternativa de error. | Formato/peso verificados; render visual corregido pendiente. |
| Movimiento | `references/motion-recipes.md`, `references/interactions.md` | GSAP acotado, reducción de movimiento, limpieza y adaptación de la sección horizontal. | Compilación y pruebas; animación real pendiente. |
| Acción y accesibilidad | `references/interactions.md` | Perfiles, foco y contactos comunes por llamada/WhatsApp. | React/jsdom y destinos verificados; navegador local bloqueado. |
| Responsive y entrega | `references/quality-gates.md`, `references/validation-scope.md` | Altura natural y retícula cuando no cabe el contenido. | Código/build revisados; comparación visual posterior pendiente. |
| Cobertura | `templates/capability-plan.md`, `templates/production-contract.md` | Este contrato acotado y el manifiesto de alcance. | Implementación y límites diferenciados. |

> HISTÓRICO: describe una versión anterior. La referencia de contenido vigente es `docs/COPY_FINAL_V11.md`. Las capturas y resultados v10 no verifican la maquetación v11.

# Auditoría de cambios — SYKR4 · vídeo reactivo tipo Lusion

## Referencia de interacción

Se ha sustituido el scrub 1:1 `scroll → currentTime` por un reproductor autónomo sensible al impulso del scroll:

- Al entrar la escena en viewport, el vídeo comienza a reproducirse automáticamente a velocidad base 1×.
- El scroll hacia abajo añade velocidad de reproducción proporcional a la velocidad real del desplazamiento.
- Al cesar el scroll, la velocidad no cae de golpe: desacelera con amortiguación exponencial y regresa suavemente a 1×.
- Un scroll significativo hacia arriba cambia la intención de movimiento. La velocidad atraviesa progresivamente `positivo → 0 → negativo`, de modo que primero se percibe una frenada y después comienza el rebobinado.
- Una vez activado el rebobinado, el vídeo continúa automáticamente hacia atrás aunque el usuario deje de hacer scroll, recuperando de forma suave una velocidad base de −1× hasta llegar a 00:00.
- Si durante el rebobinado se vuelve a desplazar hacia abajo, la misma física cruza otra vez por el punto muerto antes de recuperar la reproducción hacia delante.
- El scroll modifica energía y dirección; ya no determina el tiempo absoluto del vídeo.

### Implementación técnica

El avance positivo utiliza `HTMLVideoElement.play()` y `playbackRate` para aprovechar la reproducción nativa del navegador. El retroceso usa un reloj virtual y `currentTime` cuantizado a 24 fps porque el soporte de `playbackRate` negativo no es interoperable entre navegadores.

La velocidad toma el `scrollState` global que ya utiliza la web. Se convierte la velocidad de scroll de px/frame a px/s y se conserva la relación del prototipo original de **100 px = 1 segundo de vídeo** para calcular el impulso adicional. La velocidad queda limitada a 12× para evitar valores no razonables y el cambio de velocidad usa amortiguación distinta para aceleración, frenada e inversión.

No se añade un segundo `requestAnimationFrame`: el motor se integra en el ticker global existente.

## Sincronización planeta → texto

Los capítulos ya no usan porcentajes de scroll. Se activan usando el tiempo real/virtual del vídeo, así que permanecen unidos al planeta correcto tanto a 1× como acelerando o rebobinando.

La secuencia se revisó primero en hojas de contacto de 1 s, 0,5 s y 0,25 s. Después se inspeccionaron **fotogramas consecutivos a 24 fps** alrededor de cada transición entre mundos (36 frames por frontera) para fijar los cortes con precisión.

Ventanas finales:

| # | Texto | Tiempo |
|---|---|---|
| 01 | Infraestructura | 14,25–19,35 s |
| 02 | Cloud | 19,75–23,45 s |
| 03 | Transformación digital | 23,95–27,55 s |
| 04 | Web & hosting | 27,85–32,15 s |
| 05 | Automatización & IA | 32,45–36,70 s |
| 06 | Soporte y formación | 37,05–41,15 s |

### Corrección específica desde el cuarto planeta

- **Web & hosting** termina antes de que el planeta-ciudad/circuito tome el protagonismo.
- **Automatización & IA** queda asociada al planeta-ciudad/circuito.
- **Soporte y formación** entra con el planeta oceánico/costero y desaparece antes de la transición al complejo de aterrizaje.
- El complejo/aterrizaje empieza a aparecer aproximadamente en el frame 989, **41,208 s**. Desde ahí no queda ningún texto de servicio superpuesto.

Esto corrige el desfase anterior en el que los capítulos posteriores al tercer planeta acababan avanzando sobre el mundo siguiente o sobre la secuencia de llegada.

## Comportamiento visual

- La ventana inmersiva se abre por tiempo cuando la escena entra en viewport; ya no necesita que el usuario siga haciendo scroll para terminar la apertura.
- El vídeo usa `object-fit: contain` para conservar el encuadre completo de los seis planetas.
- HUD actualizado a `Auto · scroll = impulso`.
- Indicador dinámico `PLAY / REW / HOLD` con velocidad instantánea.
- La barra inferior representa el tiempo del vídeo y también retrocede durante el rebobinado.
- Los títulos entran/salen según la dirección de reproducción, por lo que al rebobinar la narrativa visual también se recorre en sentido inverso.
- Al rebobinar hasta 00:00 y abandonar la sección por arriba, se restaura la ventana inicial para una futura entrada limpia.

## Tarjetas inmersivas

Se conserva la modificación anterior:

- tarjeta completa activable;
- expansión desde su geometría real a pantalla completa;
- portal a `document.body` para evitar stacking contexts del `main`;
- cierre con X y Escape;
- focus trap y retorno del foco;
- bloqueo/restauración del scroll;
- reduced motion;
- CTA a Contacto.

## QA ejecutado

- Vídeo local incluido en `public/SYKR4_6_Planetas_WEB_720p.mp4`.
- Vídeo confirmado a 1280×720, 24 fps y ~76,17 s.
- Análisis visual de las seis transiciones y de la llegada final.
- Parseo/transpilación sintáctica de los **31 archivos `.ts/.tsx`** del proyecto: 0 errores sintácticos.
- Verificación de que `VideoStory.tsx` ya no depende de `CHAPTERS.range`; todos los capítulos usan `CHAPTERS.time`.
- El runtime principal sigue utilizando el vídeo local y no el vídeo anterior de Pexels.
- Prueba funcional aislada del motor en Chromium/Playwright usando un transcode corto del vídeo real: tras 1,8 s sin scroll reproduce a ~1,00×; con impulso descendente alcanzó ~9,62×; 1,4 s después de parar había frenado a ~1,11×; un gesto ascendente invirtió a ~−9,40× y, 1,8 s después sin más scroll, continuaba rebobinando automáticamente a ~−1,03× mientras el tiempo del vídeo seguía disminuyendo.

## Límite del entorno

El ZIP fuente no incluye `node_modules` y el sandbox no dispone de acceso DNS operativo a `registry.npmjs.org`, por lo que `npm ci`/`vite build` no puede completarse localmente. El código pasa la auditoría estática disponible, pero el build y la prueba visual completa deben ejecutarse en un entorno que pueda restaurar las dependencias (por ejemplo, Vercel/CI).

## v6 — corrección de captura bidireccional del vídeo

Se corrigen tres regresiones detectadas en la v5:

1. **Entrada acelerada**: el motor ya no lee `scrollState.velocity` ni `scrollState.smooth` para calcular el boost. Al capturar la escena fija `signedRate = 1` y descarta toda la inercia del gesto que produjo la entrada hasta detectar un silencio de 150 ms. El siguiente gesto independiente sí puede acelerar.
2. **Salida inferior bloqueada / pasillo muerto**: la página queda realmente bloqueada mientras el vídeo está incompleto. Al alcanzar el último frame, el motor posiciona internamente el scroll en el límite inferior de la sección y libera Lenis/navegador. El antiguo recorrido de ~7617 px se sustituye por un buffer técnico de 1200 px que no hay que recorrer manualmente.
3. **Escape superior prematuro**: durante cualquier rebobinado la página permanece bloqueada. La salida hacia arriba solo se habilita cuando `virtualTime <= 0.035` y el vídeo se fija exactamente a `00:00`.

### Máquina de estados

- `idle`: aún no se ha cruzado la escena.
- `forward`: scroll capturado; autoplay base 1×; scroll descendente añade impulso.
- `reverse`: scroll capturado; frenado + cruce por 0 + rebobinado automático base −1×.
- `releasedDown`: el vídeo terminó; se permite abandonar por abajo. Si el usuario vuelve a subir, se recaptura en el límite inferior y rebobina.
- `releasedUp`: el vídeo llegó a 00:00; se permite abandonar por arriba. Si el usuario vuelve a bajar, se recaptura en el límite superior y reproduce desde el inicio.

### Entrada y dispositivos

- Wheel, trackpad, touch y teclas de navegación se capturan mientras la escena está bloqueada.
- El gesto de entrada se consume sin aplicarse al vídeo, eliminando la aceleración inicial.
- El boost tiene decaimiento exponencial; al soltar vuelve suavemente a 1× hacia delante o −1× durante el rebobinado.
- Los textos siguen sincronizados con `currentTime/virtualTime`, por lo que no dependen del desplazamiento de página.

### Validación ejecutada

- 31 archivos `.ts/.tsx` parseados con TypeScript: **0 errores sintácticos**.
- Simulación del motor: tras un gesto de entrada continuo, velocidad **1.000×** y boost desarmado.
- Nuevo gesto descendente independiente: acelera por encima de 1× (simulación: **2.130×**).
- Inversión: la velocidad cruza 0 antes de hacerse negativa.
- Sin nuevo input durante el rebobinado, converge y se mantiene en **−1.000×** automáticamente.
- El código de `VideoStory` ya no usa `scrollState.velocity` ni `scrollState.smooth` para la velocidad del vídeo.

## v7 — sensibilidad continua + sesión one-shot

Se corrigen dos regresiones adicionales detectadas en la v6.

### 1. Aceleración e inversión demasiado difíciles / salto al cambiar de sentido

La v6 acumulaba un impulso firmado. Para invertir, el gesto contrario tenía que neutralizar primero parte del impulso anterior y, después, el objetivo de velocidad podía saltar directamente de un valor positivo alto a uno negativo alto. Aunque la interpolación era amortiguada, esa arquitectura producía una respuesta pesada y un cambio perceptiblemente brusco.

La v7 separa **intención de dirección** y **magnitud de boost**:

- un gesto contrario cambia inmediatamente la intención de dirección; ya no tiene que "vencer" el impulso anterior;
- la velocidad actual se amortigua primero hacia `0×` (`CROSS_DAMPING`) y solo después cruza al otro signo;
- cerca de `0×` avance y retroceso comparten un único reloj virtual, evitando alternancias `play/pause/seek` con dos relojes distintos;
- la velocidad no puede variar más de un máximo por frame (14×/s al acelerar y 7×/s al volver a la base), lo que evita latigazos aunque lleguen deltas muy grandes de rueda/trackpad;
- la curva del wheel es no lineal: pequeños deltas ya producen una respuesta visible, mientras que deltas grandes saturan progresivamente hasta un máximo de 10×;
- el grace period de entrada es fijo (90 ms). Ya no es necesario dejar de hacer scroll y empezar un gesto nuevo para acelerar.

Resultado de simulación con un gesto moderado (`deltaY=20`): `1.00× → 1.23× → 1.70× → 2.40×` en ~100 ms. Al invertir desde velocidad positiva, la curva pasa por ~`0.06×`, cruza a `−0.055×` y continúa hacia la base inversa sin salto de signo.

### 2. Reinicio al hacer scroll caótico

Se añaden dos protecciones complementarias:

- **Guard de `HTMLVideoElement.ended`**: `ensureForwardPlayback()` nunca llama a `play()` si el vídeo está en `ended` o dentro de los últimos ~55 ms. Esto evita el comportamiento nativo por el que `play()` sobre un vídeo terminado puede volver a iniciar desde el principio.
- **Sesión one-shot**: cuando un vídeo que ya ha empezado rebobina completamente hasta `00:00`, la sesión queda `sessionClosed=true`. Desde ese momento no existe ninguna ruta que pueda volver a ejecutar `engage()` en esa carga de página. El usuario puede atravesar la sección, pero el vídeo no se reproduce una segunda vez desde cero.

Se conserva la posibilidad solicitada anteriormente de volver desde abajo tras haber llegado al final y entrar en rebobinado. Ese rebobinado forma parte de la misma sesión; cuando alcanza `00:00`, la experiencia se cierra definitivamente para esa carga.

### Captura de límites

El buffer técnico baja de 1200 px a 32 px. Las entradas ya no dependen de caer exactamente dentro de esos 32 px: se detecta también el cruce de los límites entre el frame anterior y el actual. Esto evita tanto un pasillo invisible como saltarse la captura con un trackpad rápido.

### QA v7

- 31 archivos `.ts/.tsx` parseados con TypeScript: **0 errores sintácticos**.
- El motor ya no contiene `inputArmed`, impulso firmado acumulativo ni reinicio automático desde `releasedUp`.
- `sessionClosed` bloquea cualquier nueva captura tras alcanzar `00:00`.
- `ensureForwardPlayback()` contiene guard explícito de `v.ended` / extremo final.
- La velocidad por frame está acotada; una ráfaga alternante no puede producir un salto instantáneo de signo.

## v8 — captura imposible de saltar (2026-09-25)

### Bug corregido
En v7 la detección de entrada dependía del ticker de animación y de `scrollState.direction`. Un desplazamiento muy grande podía mover la página desde antes de la sección hasta después de ella entre dos frames. Si además el vídeo todavía no tenía `loadedmetadata`, `engage()` rechazaba la captura por `ready === false`.

### Arquitectura nueva
- La entrada se detecta ahora en `wheel` (puerta predictiva) y en cada evento nativo `scroll` (puerta de cruce), no solo en el ticker.
- Un salto de scroll que cruce `bounds.top` se intercepta aunque termine miles de píxeles después de la sección.
- La captura sucede aunque el vídeo todavía no haya terminado de cargar metadatos: la página queda bloqueada y el vídeo arranca en cuanto queda listo.
- Se conserva una `trapY` fija durante toda la captura. Si queda inercia pendiente del navegador, Lenis, trackpad o teclado, cualquier desviación de `scrollY` se corrige inmediatamente al ancla.
- `End`, `PageDown`, espacio y flechas tienen también una puerta predictiva para evitar animaciones nativas que continúen después de la captura.
- La sesión one-shot de v7 se mantiene: una sesión cerrada no puede reiniciarse.

### Pruebas reales en Chromium headless
Se ejecutó una página de prueba de navegador con la misma máquina de puertas y un `HTMLVideoElement` real. Se forzó además un retraso de 700 ms en la disponibilidad del vídeo para probar el peor caso de carga.

Resultado: 8/8 pruebas superadas.

1. Wheel +10.000 px antes de `ready`: capturado en `top`, página bloqueada.
2. Al quedar el medio listo: la reproducción arranca sin perder la captura.
3. Ráfaga rápida de 6 × 700 px: no salta la sección y solo hay un `engage`.
4. Salto directo `scrollTo(0, 6000)`: el evento `scroll` devuelve la página a `top`.
5. Tecla `End`: no puede saltar la sección.
6. Spam de `PageDown`: la página permanece clavada a `trapY`.
7. 50 eventos alternos de wheel +5000/−5000: permanece atrapado, sin reentradas.
8. Entrada inversa desde debajo con wheel −5000: captura exacta en la puerta inferior.

Durante la primera ronda de la auditoría, el caso `PageDown` falló porque quedaba scroll nativo en vuelo. No se empaquetó esa versión: se añadió el ancla `trapY`, se repitió la batería y entonces las 8 pruebas pasaron.

### Auditoría estática
- 31 archivos `.ts/.tsx` parseados con TypeScript: 0 errores sintácticos.
- Vídeo verificado: H.264, 1280×720, 24 fps, 76,166667 s.

### Limitación del entorno
No se pudo ejecutar el build completo de Vite porque este sandbox no tiene resolución DNS hacia `registry.npmjs.org` y el ZIP no incluye `node_modules`. La interacción de captura se validó en Chromium con DOM real, scroll real y `HTMLVideoElement` real, pero no se afirma un build Vite ejecutado dentro de este entorno.

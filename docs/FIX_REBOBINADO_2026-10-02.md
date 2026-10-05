# Fix de rebobinado — 2026-10-02

## Síntoma
El recorrido reproducía con fluidez hacia delante, pero al invertir el sentido aparecía un salto perceptible y después tirones durante el rebobinado.

## Causa confirmada
La versión optimizada del MP4 tenía solo 9 keyframes en 76,17 s (intervalos de aproximadamente 10,4 s). El rebobinado de `VideoStory.tsx` usa seeks sucesivos con `currentTime`; con un GOP tan largo el decoder tiene que reconstruir demasiados frames desde el keyframe anterior en cada seek.

La fuente de producción anterior tenía 305 keyframes, uno cada 0,25 s. Esa estructura es mucho más adecuada para scrub/rebobinado.

## Corrección
- Se mantiene H.264 High Profile, 1280×720, 24 fps y 76,17 s.
- Nuevo encode: GOP fijo de 6 frames = keyframe cada 0,25 s.
- 305 keyframes totales.
- Tamaño final del vídeo: 22.042.473 bytes (~21,0 MiB), frente a ~42,9 MiB de la fuente anterior de producción.
- Se conserva `faststart` para streaming.
- La línea que mostraba `Cargando el recorrido…` se deja comentada, tal como se solicitó.

## Medición de seek inverso
Prueba de 120 seeks consecutivos hacia atrás, frame a frame, alrededor del segundo 60 (OpenCV/FFmpeg, mismo entorno):

| Asset | Keyframes | Mediana seek | P95 | Media |
|---|---:|---:|---:|---:|
| V1 anterior | 9 | 96,3 ms | 155,8 ms | 93,6 ms |
| V1 corregida | 305 | 29,5 ms | 39,1 ms | 30,3 ms |

A 24 fps el presupuesto por frame es 41,7 ms. La versión anterior quedaba muy por encima; la corregida entra normalmente dentro de ese presupuesto.

## Calidad visual
Comparación SSIM contra la fuente de producción original:
- V1 anterior: 0,986085
- V1 corregida: 0,985320

La diferencia es mínima y el nuevo archivo mantiene una reducción de tamaño importante respecto a la fuente original, pero recupera la estructura de keyframes necesaria para el rebobinado.

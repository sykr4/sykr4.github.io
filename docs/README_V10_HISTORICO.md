# SYKR4 · revisión final v10

Base conservada: entrega **SYKR4_WEB_v9** abierta en esta carpeta, sin repositorio Git. Los recursos originales, los cinco servicios y los seis planetas permanecen. No se ha publicado en producción.

## Arranque

Node.js **22.18 o superior** (comprobado con 22.23.2) y npm:

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre la URL de Vite. Si ese puerto está ocupado, utiliza otro y ajusta `PUBLIC_ORIGIN` si configuras el receptor. Vídeo y GLB necesitan HTTP, no abrir el HTML con doble clic.

```bash
npm run check
npm test
npm run build
npm run preview
```

La compilación genera `dist/` con el HTML, MP4, imágenes y astronauta. `preview` incluye la API local del formulario para comprobarla; no es el servidor recomendado para producción.

## Formulario: implementación completa, conexión pendiente

La opción por defecto utiliza **POST /api/contact**, servido tanto por Vite como por el servidor Node incluido. No descarga una consulta ni simula un envío. Mientras faltan las variables del receptor se muestra que el envío no está conectado, la API responde **503** y el formulario conserva los datos.

Copia `.env.example` a `.env.local` y configura **en el servidor**:

| Variable | Valor necesario |
|---|---|
| RESEND_API_KEY | Clave de envío de Resend |
| CONTACT_TO | Correo destinatario real de SYKR4 |
| CONTACT_FROM | Dirección remitente de un dominio verificado en Resend |
| PUBLIC_ORIGIN | Origen exacto de la web, por ejemplo http://127.0.0.1:5173 en desarrollo |
| HOST / PORT | Dirección y puerto del servidor Node |

No pongas claves en variables `VITE_*`, en Git, en capturas ni en el chat. En un alojamiento, utiliza su almacén de secretos/variables. Reinicia el servidor tras cambiar variables. Una aceptación del proveedor **no demuestra entrega en la bandeja de entrada**: esa comprobación requiere una prueba real cuando se configure el destino.

La integración implementada usa la [API oficial de Resend](https://resend.com/docs/api-reference/emails/send-email) y sus [claves de idempotencia](https://resend.com/docs/dashboard/emails/idempotency-keys). Incluye validación compartida cliente/servidor, límites de longitud y cuerpo, origen permitido, campo trampa, límite de frecuencia, timeout, prevención de duplicados y errores sin pérdida del texto. Detalles y límites: [CONTACTO_ASTRONAUTA.md](CONTACTO_ASTRONAUTA.md).

## Ejecutar la compilación con su backend

```bash
npm run build
npm start
```

Abre http://127.0.0.1:3000. Configura el `PUBLIC_ORIGIN` correspondiente para probar el envío en ese puerto. El servidor Node sirve **solo dist/** y **/api/contact**, con soporte de rangos para el MP4.

Para una futura publicación: ejecutar este servidor tras un proxy HTTPS, o conectar `VITE_CONTACT_ENDPOINT` a una API equivalente. Un hosting exclusivamente estático puede servir la parte visual, pero **no ejecuta el receptor Node**; no basta con subir `dist/` para activar el envío. No hay datos del alojamiento definitivo en esta entrega. No se ha creado cuenta, dominio ni servicio externo.

## Comprobaciones en navegador

```bash
npx playwright install chromium firefox webkit
# Linux, si faltan bibliotecas del sistema:
npx playwright install-deps
npm run test:browser
node scripts/qa/responsive.mjs
node scripts/qa/walkthrough.mjs
```

Los scripts usan http://127.0.0.1:4175; las pruebas de Playwright pueden arrancar ese servidor. Para una URL ya en ejecución, establece `QA_BASE_URL`. Los otros dos scripts requieren un servidor iniciado.

Resultados, causas corregidas, matriz y límites: [INFORME_REVISION_V10.md](docs/INFORME_REVISION_V10.md). Evidencias en [docs/qa](docs/qa/), incluidas capturas anteriores y posteriores, resultados JSON y grabación. La carpeta `tests/` mantiene las regresiones anteriores y añade las de navegación y receptor.

## Comportamiento preservado

- Inicio, identidad, colores, contenido y sistema de partículas conservados; HUD y botones distribuidos sin solapamientos.
- Cinco tarjetas y cinco rótulos: IA y automatización; AWS, cloud y costes; Seguridad y Microsoft 365; Desarrollo e integraciones; Web y ecommerce.
- MP4 original con seis planetas, siendo el sexto la llegada. El óvalo era un aviso HTML vacío: el recurso no se ha recortado ni editado.
- Captura en cada entrada manual, incluida la inversa y los saltos grandes. Solo «Volver arriba» utiliza el salto explícito sin captura. Una ancla/CTA conserva la captura y continúa al destino al terminar; una nueva entrada manual cancela ese destino pendiente.
- Contacto y astronauta V4 después del recorrido, con gestos automáticos y controles opcionales.
- Movimiento reducido y carga fallida dejan una página utilizable.

`AUDITORIA_CAMBIOS.md` contiene el historial previo a v9; el informe v10 es la referencia para esta entrega.

# Contacto y astronauta · v10

## Receptor de consultas

La v9 no incluía backend ni destino verificado. Se conserva su código de preparación offline como opción explícita, pero **la ruta por defecto ahora es /api/contact**. El servidor utiliza Resend y responde con éxito únicamente tras obtener un identificador de aceptación de su API.

Configuración: copiar `.env.example` a `.env.local` o guardar las variables en el alojamiento, completar `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` y `PUBLIC_ORIGIN`, y reiniciar el servidor. El remitente debe pertenecer a un dominio verificado en Resend. No se ha configurado ni contactado un receptor real durante esta revisión.

El servidor se comparte entre desarrollo, preview y `npm start`. Este último sirve `dist/` y la API; admite byte ranges para el vídeo. Un despliegue solo de archivos estáticos necesita alojar la API aparte y configurar `VITE_CONTACT_ENDPOINT` al compilar.

### Contrato

POST JSON a `/api/contact`, con `name`, `email`, `company`, `message`, `services` (las cinco áreas y la opción existente «Quiero orientación») y `website` vacío. Cabecera `Idempotency-Key`: UUID estable para reintentos del mismo contenido. El navegador genera la clave. El backend devuelve:

- 202 con `{ok:true, accepted:true, id:...}` únicamente después de la aceptación del proveedor.
- 422 para campos inválidos o campo trampa, 400 para petición inválida, 403 para origen incorrecto, 413 para cuerpo excesivo, 415 para formato distinto de JSON.
- 429 para límite de frecuencia, 502 para error/timeout del proveedor, 503 mientras no está configurado.
- GET `/api/contact/status` informa solo de disponibilidad de configuración, sin exponer destinatarios ni claves.

El mensaje de éxito distingue aceptación de llegada al buzón. Los ensayos del receptor sustituyen únicamente el transporte hacia Resend por un doble local; **no acreditan entrega de correo real**.

### Límites y protección

Mismas reglas en cliente y servidor: nombre 120, correo 254, empresa 160 y mensaje entre 10 y 6000 caracteres; servicios permitidos. Cuerpo máximo 32 KiB, timeout de lectura 10 s y de proveedor 10 s. El cliente espera hasta 15 s y conserva el texto ante cualquier error.

Se exige origen exacto, JSON y Fetch Metadata compatible; no hay CORS abierto. Campo trampa y límite de cinco intentos por IP cada diez minutos, con techo global de 100 intentos en esa ventana. Se coalescen envíos concurrentes por UUID y se conserva la aceptación durante 24 horas. Los reintentos inciertos usan la misma clave en Resend. El formulario desactiva campos y botón durante el envío y evita repetir contenido ya aceptado.

Estos límites viven **en memoria de una instancia Node**. Reiniciar borra su memoria; la idempotencia del proveedor sigue protegiendo dentro de su ventana. Para varias instancias se necesita un almacén compartido y protección de frecuencia en el proxy/servicio. No equivalen a protección completa frente a bots distribuidos.

`TRUST_PROXY=0` usa la IP del socket. Solo usar `TRUST_PROXY=1` tras **un proxy de confianza que reescriba X-Forwarded-For**, con acceso directo al backend cerrado. Bajo proxy sin esa configuración las visitas comparten el límite de la IP del proxy. No se registran mensajes ni secretos en logs.

Las variables `VITE_*` son públicas. `VITE_CONTACT_ENDPOINT` permite reutilizar otro receptor; ese receptor debe implementar validación, protección y confirmación. `VITE_CONTACT_MODE=download` activa explícitamente la antigua copia TXT, y `VITE_CONTACT_MODE=email` con `VITE_CONTACT_EMAIL` abre el cliente de correo. Ninguno de esos modos declara un envío.

### Pendiente para activar

Destinatario de SYKR4, remitente/dominio verificado y clave de envío de Resend (o endpoint receptor ya existente), además del origen HTTPS del despliegue definitivo. Tras configurarlos: probar una consulta autorizada, comprobar aceptación en el proveedor y revisar por separado bandeja de entrada/spam. Esa prueba real no se ha realizado.

## Astronauta original V4

Se conservan sin cambios el GLB, motor y vista estática de `public/astronaut/`. SHA-256 del GLB: `1881085722f3d462d6ba6ead6698dd6bfb447a61f21b42789df555818dea8083`.

Se mantienen Idle, Wave_One_Hand, Wrist_Check y Military_Salute. El saludo de entrada y los gestos periódicos se ejecutan automáticamente; «Probar gestos» es opcional. El motor observa la visibilidad, pausa fuera de pantalla y al escribir, respeta movimiento reducido y libera recursos al desmontarse. Si WebGL falla muestra la vista de reserva.

Diagnóstico local: `document.querySelector('[data-astronaut-host]').sykr4Astronaut.getDiagnostics()`. Incluye clips, renderizado, pausa, preferencias y contador de gestos automáticos. Las pruebas del motor están en `tests/astronaut.test.mjs`; las evidencias de navegador, en `docs/qa/`.

Las rutas del personaje respetan la base de Vite. La API incluida está pensada para un origen raíz; si se publica bajo un prefijo, hay que enrutar `/api/contact` explícitamente en el proxy o definir un endpoint adecuado.

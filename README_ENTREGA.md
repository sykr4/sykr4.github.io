# SYKR4 v13 — resultados reales y evaluación

La web incorpora el copy final, cinco tarjetas ampliadas, CTA por servicio, perfiles reales del equipo y una jerarquía de lectura orientada a contacto. Base: SYKR4_WEB_v12. El ahorro del 40 % en AWS y los más de 200 servidores se muestran como experiencia real del equipo, confirmada por Enrique el 28 de septiembre. No se ha publicado.

## Revisar la web

La entrega incluye por separado `SYKR4_V13_Vista_previa.html`, autocontenida, para abrir con doble clic en un navegador. Contiene medios y tipografías; puede tardar unos segundos por su tamaño. Su formulario prepara una consulta descargable, no la envía.

Para revisar el proyecto completo en tu ordenador (Node.js 22.18 o posterior):

```bash
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --open
```

Abre http://127.0.0.1:5173/. En Linux puedes ejecutar `bash INICIAR_LOCAL.sh`, que instala dependencias si faltan y abre esa dirección. Si el puerto ya está ocupado, usa la URL que indique Vite.

## Contenido y validación

- `docs/CAMBIOS_V13.md`: corrección vigente de los resultados reales y notas de validación.
- `docs/EVALUACION_WEB_V13.md`: evaluación de la web, nota y mejoras prioritarias.
- `docs/CAMBIOS_V12.md`: histórico de widgets y presentación del equipo; la confirmación de cifras en v13 prevalece.
- `docs/COPY_FINAL_V11.md`: auditoría, propuesta, textos anteriores/nuevos y SEO de la base v11; los cambios v13 prevalecen.
- `docs/MAPA_SERVICIOS_V11.md`: correspondencia con el PDF, subservicios y límites.
- `src/data/content.ts`: contenido central de tarjetas, ejemplos, método y vídeo.
- Cinco servicios, 16 aplicaciones de IA, vídeo y astronauta originales.
- Build y TypeScript v13 correctos. Las 58 pruebas tienen resultado correcto registrado en v12. QA visual v13 pendiente: el navegador remoto bloqueó localhost y file://. La carpeta `docs/qa` contiene evidencia histórica v10, rotulada como tal.

```bash
npm run check
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

## Formulario de producción

La fuente utiliza `/api/contact` y conserva validación, control de duplicados y manejo de errores. El envío real requiere configurar `.env.local` a partir de `.env.example`: `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` y `PUBLIC_ORIGIN`. No se han facilitado esos datos ni probado correos reales. Nunca incluyas secretos en variables `VITE_*`.

Sin configuración muestra indisponibilidad y no presenta la consulta como enviada. La vista HTML de revisión usa el modo descarga de forma expresa. Los textos legales definitivos todavía no se han facilitado.

```bash
npm run build
npm start
```

`npm start` sirve `dist/` y la API desde el servidor Node incluido. Un alojamiento solo estático no ejecuta ese backend. Más información técnica en `CONTACTO_ASTRONAUTA.md`; instrucciones históricas en `docs/README_V10_HISTORICO.md`.

El recorrido sigue interceptando las entradas normales y continúa hacia el destino de los CTA al finalizar. «Volver arriba» conserva su excepción y no reproduce de nuevo el vídeo. La revisión de textos no altera ese contrato.

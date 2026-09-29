# Evaluación de SYKR4 — v13

28 de septiembre de 2026.

**Nota global orientativa: 7,5/10.** El diseño tiene personalidad y la base técnica está cuidada. El principal margen de mejora está en convertir esa impresión en confianza y facilitar el contacto.

Es una valoración de diseño, contenido y código, basada en el proyecto y la captura aportada. No es una puntuación Lighthouse ni una auditoría visual completa en dispositivos reales.

| Área | Nota orientativa | Motivo |
| --- | --- | --- |
| Identidad y diseño | 8,5/10 | Tipografía, paleta, partículas y composición coherentes. Los textos pequeños de los indicadores pierden legibilidad. |
| Textos y oferta | 8/10 | Servicios, entregables y método claros; equipo con experiencia visible. Falta priorizar el cliente objetivo y desarrollar casos reales. |
| Implementación | 7,5/10 | Componentes organizados, TypeScript, validación compartida y fallbacks. La experiencia visual tiene bastante complejidad y peso. |
| Preparación para captar consultas | 6/10 | Falta conectar y probar el envío, facilitar el acceso al formulario y completar información corporativa y medición. |

La nota global es una valoración conjunta; no procede de una medición automática ni de un promedio estadístico.

## Lo que está bien hecho

- **Identidad reconocible.** El titular, los colores y la escena 3D forman una propuesta visual consistente. Las cifras principales destacan.
- **Oferta explicada con contenido útil.** Las cinco áreas detallan problemas, alcance, entregables y siguiente paso. Los CTA de cada servicio preseleccionan el interés en el formulario.
- **Experiencia visible.** El ahorro real del 40 % en AWS y los más de 200 servidores gestionados aportan autoridad. Enrique y Javier aparecen con 10 y 5 años de experiencia, respectivamente, dentro de un equipo multidisciplinar.
- **Base técnica organizada.** React y TypeScript por secciones, datos comerciales centralizados, componentes reutilizables y validación compartida entre cliente y servidor.
- **Cuidado en el formulario.** Backend incluido, validación, protección frente a envíos repetidos, control de frecuencia y manejo de errores. No presenta una consulta como enviada cuando no hay confirmación.
- **Adaptación técnica existente.** Hay perfiles de calidad por dispositivo, carga diferida de medios, alternativas visuales y gestión del foco en diálogos.

## Prioridades

### 1. Hacer que contactar funcione de principio a fin

El proyecto incluye una API real con Resend. En la entrega todavía no están configurados el proveedor, el remitente, el destinatario y el origen de producción. Sin ellos la API comunica indisponibilidad. Configurarlos y comprobar la recepción real es la primera tarea antes de captar tráfico.

También incorporaría un correo corporativo visible como canal alternativo, utilizando los datos reales de la empresa.

Evidencia: `src/sections/Contact.tsx`, `server/contact.ts`, `.env.example`.

### 2. Permitir una ruta directa desde el CTA hasta contacto

El botón «Hablemos de tu proyecto» conserva el destino, pero el recorrido de vídeo intercepta el desplazamiento antes de llegar al formulario. El vídeo dura unos 76 segundos a velocidad normal; el scroll permite acelerarlo, por lo que no implica siempre esperar ese tiempo.

Mi recomendación comercial es conservar el recorrido visual y dar acceso directo al formulario a quien ya quiere hablar. El funcionamiento actual fue un requisito anterior y se mantiene en esta versión; aquí se evalúa su efecto sobre la captación.

Evidencia: `src/lib/scroll.ts`, `src/sections/VideoStory.tsx`.

### 3. Desarrollar uno o dos casos reales a partir de vuestra experiencia

Las dos cifras del inicio ya se muestran como reales. La sección de casos, sin embargo, presenta cuatro ejemplos de situaciones. Conviene añadir proyectos realizados que expliquen el problema, vuestra intervención y el resultado. Pueden ser anónimos.

El ahorro del 40 % y la gestión de más de 200 servidores son buenos puntos de partida. Faltan los detalles de cada proyecto para convertirlos en relatos comerciales completos. No hace falta inventar nombres de clientes ni publicar información confidencial.

Evidencia: `src/sections/Hero.tsx`, `src/data/content.ts`, `src/sections/Cases.tsx`.

### 4. Aligerar medios y mejorar legibilidad y accesibilidad

El vídeo ocupa aproximadamente 43 MiB y el modelo del astronauta 8,3 MiB. Se cargan al acercarse a sus secciones: no representan toda la descarga inicial. El HTML de producción, con JavaScript y CSS incorporados, ocupa aproximadamente 1,1 MB antes de compresión.

Optimizaría versiones del vídeo y del modelo, y prepararía compresión y caché de activos para el alojamiento final. El servidor incluido utiliza `no-cache`; permite revalidación y no significa por sí solo que nunca pueda almacenarse una respuesta.

En la captura, las etiquetas pequeñas de los indicadores tienen menos presencia que las cifras y compiten con las partículas. Subiría su tamaño y contraste, y reduciría la actividad del fondo detrás de esos textos.

También completaría la preferencia de movimiento reducido: algunas animaciones de GSAP y WebGL continúan aunque se reduzcan las animaciones CSS. Después comprobaría móvil, teclado, modales, servicios horizontales y formulario en dispositivos reales.

Evidencia: `public/`, `dist/index.html`, `server/index.ts`, `src/sections/Services.tsx`, `src/sections/Cases.tsx`, `src/gl/ParticleField.ts`, `src/index.css` y captura aportada.

### 5. Completar confianza corporativa, SEO y medición

- **Información corporativa:** incorporar datos reales de empresa, canal de contacto y textos y enlaces de privacidad y aviso legal. El pie actual no los incluye. Esta observación es un inventario de contenido pendiente, no una auditoría jurídica.
- **Cliente objetivo:** definir a qué empresas se dirige prioritariamente la oferta y expresarlo en la entrada. Actualmente se enumeran muchas capacidades, pero se concreta menos quién tiene más motivos para contratar.
- **SEO:** el título y la descripción están resueltos. Faltan URL canónica, imagen para compartir y sitemap. Crear páginas propias por servicio permitiría compartirlas y desarrollar búsquedas específicas. La arquitectura actual no implica que la web sea inindexable.
- **Medición:** registrar unos pocos eventos útiles, como clic a contacto, servicio elegido y envío confirmado, para evaluar qué genera consultas. No hay un sistema de analítica identificado en el proyecto.
- **Prueba de equipo:** fotografías reales o perfiles profesionales, si se quieren publicar, aportarían contexto a los perfiles actuales.

Evidencia: `index.html`, `src/sections/Footer.tsx`, `src/sections/Contact.tsx`, `src/sections/Services.tsx`.

## Orden propuesto

Primero, envío real y acceso a contacto. Después, casos reales e información corporativa. A continuación, optimización de medios y revisión móvil/accesible. Por último, ampliar páginas de servicio y usar la medición para decidir las siguientes mejoras.

## Qué se ha cambiado y comprobado en v13

Se han corregido las etiquetas de los indicadores reales y su accesibilidad semántica. Se mantiene la presentación senior del equipo y el tercer indicador de automatización. Las demás mejoras de este informe son recomendaciones, no cambios ya realizados.

La comprobación de TypeScript y la compilación son correctas, tanto en el proyecto como en la copia portátil de revisión. No se han medido tiempos de carga, tasa de conversión ni puntuaciones de rendimiento. La suite de 58 pruebas tiene un resultado correcto registrado en v12; no es una ejecución nueva de v13.

La vista previa HTML permite revisar el contenido sin servidor y prepara una consulta descargable; no envía correos. La web de producción conserva su backend y requiere configuración.

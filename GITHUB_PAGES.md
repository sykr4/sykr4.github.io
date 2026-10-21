# Despliegue de SYKR4 en GitHub Pages

Este proyecto está preparado para publicarse en el repositorio **sykr4/sykr4.github.io** y servirse desde:

- `https://sykr4.github.io/`
- `https://sykr4.com/` como dominio personalizado

> Recomendado para trabajar en local: **Node.js 24 LTS (24.15 o superior)**.

## Configuración inicial en GitHub

Solo hay que hacerlo una vez:

1. Sube este proyecto a la rama `main` del repositorio `sykr4.github.io`.
2. En GitHub abre **Settings → Pages**.
3. En **Build and deployment → Source**, selecciona **GitHub Actions**.
4. En **Custom domain**, mantén/configura `sykr4.com`.
5. Cuando GitHub lo permita, activa **Enforce HTTPS**.

El workflow `.github/workflows/deploy-pages.yml` compila y publica automáticamente la web cada vez que haces `push` a `main`.

## Flujo normal para actualizar la web

```bash
git add .
git commit -m "Actualiza web"
git push origin main
```

No hace falta ejecutar `npm run build` antes de hacer push: GitHub Actions ejecuta `npm ci`, comprobación TypeScript, tests y build antes de publicar.

## Comprobar localmente antes de subir

```bash
npm ci
npm run check
npm test
npm run build
npm run preview
```

La salida de producción se genera en `dist/`.

## Vite y rutas

`vite.config.ts` usa explícitamente `base: "/"` porque `sykr4.github.io` es un sitio de usuario en la raíz y el dominio personalizado `sykr4.com` también sirve desde la raíz.

## Formulario de contacto en GitHub Pages

GitHub Pages solo sirve archivos estáticos y no puede ejecutar el servidor Node incluido en `server/`.

La compilación de producción lee dos variables públicas del entorno, las Repository Variables `VITE_CONTACT_ENDPOINT` y `VITE_TURNSTILE_SITE_KEY`. El workflow las pasa al paso de build. No van en `.env.production` ni hay un valor alternativo en el código. Si falta alguna, `npm run build` se detiene: no descarga un TXT, no abre el correo y no simula un envío.

En local, exporta esas mismas variables públicas en el proceso antes de `npm run build`. No hace falta ningún secreto. La ruta `POST /contact` sigue exigiendo IAM hasta que se autorice su apertura, así que el navegador recibirá 403 hasta entonces.

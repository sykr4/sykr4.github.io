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

GitHub Pages solo sirve archivos estáticos y no puede ejecutar el backend Node incluido en `server/`.

Por eso `.env.production` establece:

```env
VITE_CONTACT_MODE=download
```

Así el formulario no intenta llamar a `/api/contact` ni muestra un envío ficticio: valida los datos y prepara la consulta como archivo de texto.

Si más adelante se quiere envío real, hay que configurar un endpoint HTTPS externo en `VITE_CONTACT_ENDPOINT` o cambiar a modo email con una dirección real.

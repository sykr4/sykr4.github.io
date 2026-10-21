import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { contactConfig, createContactHandler } from "./server/contact";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
const PRODUCTION_CONTACT_ENDPOINT = "https://w80imhinme.execute-api.eu-west-1.amazonaws.com/contact";

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  if (command === "build" && mode === "production") {
    const endpoint = typeof env.VITE_CONTACT_ENDPOINT === "string" ? env.VITE_CONTACT_ENDPOINT.trim() : "";
    const siteKey = typeof env.VITE_TURNSTILE_SITE_KEY === "string" ? env.VITE_TURNSTILE_SITE_KEY.trim() : "";
    if (!endpoint || !siteKey) {
      throw new Error("Falta VITE_CONTACT_ENDPOINT o VITE_TURNSTILE_SITE_KEY. La compilación de producción se ha detenido para no publicar un formulario que descargue un TXT, abra el correo o simule un envío.");
    }
    if (endpoint !== PRODUCTION_CONTACT_ENDPOINT) {
      throw new Error("VITE_CONTACT_ENDPOINT no es el endpoint permitido. La compilación de producción se ha detenido y no se usará otro destino.");
    }
  }
  const contact = createContactHandler(contactConfig(env));
  const middleware: import("vite").Connect.NextHandleFunction = (req, res, next) => {
    void contact(req, res).then(handled => { if (!handled) next(); }).catch(next);
  };
  return {
  // sykr4.github.io is a user site and sykr4.com points to the root, so assets must resolve from /.
  base: "/",
  server: {
    allowedHosts: ["far-findings-shared-accuracy.trycloudflare.com"],
  },
  plugins: [react(), tailwindcss(), viteSingleFile(), {
    name: "sykr4-contact-server",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  }],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}; });

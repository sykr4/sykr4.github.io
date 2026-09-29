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
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const contact = createContactHandler(contactConfig(env));
  const middleware: import("vite").Connect.NextHandleFunction = (req, res, next) => {
    void contact(req, res).then(handled => { if (!handled) next(); }).catch(next);
  };
  return {
  // sykr4.github.io is a user site and sykr4.com points to the root, so assets must resolve from /.
  base: "/",
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

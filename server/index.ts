import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { contactConfig, createContactHandler } from "./contact.ts";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const contact = createContactHandler(contactConfig(process.env));
const mime: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".mp4": "video/mp4", ".glb": "model/gltf-binary", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  try {
    if (await contact(req, res)) return;
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405).end(); return; }
    const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    if (pathname.startsWith("/api/")) { res.writeHead(404).end(); return; }
    const file = resolve(root, pathname === "/" ? "index.html" : `.${pathname}`);
    if (!file.startsWith(root.endsWith(sep) ? root : root + sep) || pathname.split("/").some(p => p.startsWith("."))) { res.writeHead(404).end(); return; }
    const info = await stat(file);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Accept-Ranges", "bytes");
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    let start = 0, end = info.size - 1;
    if (req.headers.range) {
      if (!range || (!range[1] && !range[2])) { res.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end(); return; }
      start = range[1] ? Number(range[1]) : Math.max(0, info.size - Number(range[2]));
      end = range[1] && range[2] ? Math.min(Number(range[2]), end) : end;
      if (start > end || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) { res.writeHead(416, { "Content-Range": `bytes */${info.size}` }).end(); return; }
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${info.size}`);
    }
    res.setHeader("Content-Length", end - start + 1);
    if (req.method === "HEAD") { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    res.on("close", () => stream.destroy());
    stream.on("error", () => res.destroy());
    stream.pipe(res);
  } catch { if (!res.headersSent) res.writeHead(404).end(); else res.destroy(); }
});
server.requestTimeout = 15_000;
server.headersTimeout = 15_000;
server.listen(Number(process.env.PORT || 3000), process.env.HOST || "127.0.0.1", () => console.log(`SYKR4: http://${process.env.HOST || "127.0.0.1"}:${process.env.PORT || 3000}`));

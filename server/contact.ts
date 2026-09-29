import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash } from "node:crypto";
import { validateContact, validEmail } from "../shared/contact.ts";

type Config = { apiKey: string; to: string; from: string; origin: string; trustProxy?: boolean };
type Reply = { status: number; body: Record<string, unknown> };
const WINDOW = 10 * 60_000;
const DAY = 24 * 60 * 60_000;
const MAX_BODY = 32_768;

export function contactConfig(env: Record<string, string | undefined>): Config {
  return { apiKey: env.RESEND_API_KEY?.trim() || "", to: env.CONTACT_TO?.trim() || "", from: env.CONTACT_FROM?.trim() || "", origin: env.PUBLIC_ORIGIN?.replace(/\/$/, "") || "", trustProxy: env.TRUST_PROXY === "1" };
}

/** One instance for dev, preview or the production Node server. No credentials reach Vite's client. */
export function createContactHandler(config: Config, sendFetch: typeof fetch = fetch) {
  const buckets = new Map<string, { count: number; expires: number }>();
  const requests = new Map<string, { hash: string; expires: number; work: Promise<Reply> }>();
  let globalCount = 0, globalExpires = 0;
  const configured = Boolean(config.apiKey && validEmail(config.to) && validEmail(config.from) && /^https?:\/\/[^/]+$/.test(config.origin));
  const reply = (res: ServerResponse, status: number, body: Record<string, unknown>) => {
    if (res.destroyed || res.writableEnded) return;
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    res.end(JSON.stringify(body));
  };
  return async (req: IncomingMessage, res: ServerResponse) => {
    const path = req.url?.split("?")[0];
    if (path !== "/api/contact" && path !== "/api/contact/status") return false;
    if (path === "/api/contact/status" && req.method === "GET") { reply(res, 200, { available: configured }); return true; }
    if (path !== "/api/contact" || req.method !== "POST") { res.setHeader("Allow", "POST"); reply(res, 405, { ok: false, code: "method" }); return true; }
    if (!configured) { reply(res, 503, { ok: false, code: "unconfigured" }); return true; }
    // JSON + exact same-origin + Fetch Metadata checks. No permissive CORS.
    if (req.headers.origin !== config.origin || req.headers["sec-fetch-site"] === "cross-site") { reply(res, 403, { ok: false, code: "origin" }); return true; }
    if (!/^application\/json(?:;|$)/i.test(req.headers["content-type"] || "")) { reply(res, 415, { ok: false, code: "content_type" }); return true; }
    const now = Date.now();
    for (const [key, value] of buckets) if (value.expires < now) buckets.delete(key);
    for (const [key, value] of requests) if (value.expires < now) requests.delete(key);
    const forwarded = config.trustProxy ? String(req.headers["x-forwarded-for"] || "").split(",").at(-1)?.trim() : "";
    const ip = forwarded || req.socket.remoteAddress || "unknown";
    const bucket = buckets.get(ip) ?? { count: 0, expires: now + WINDOW };
    if (now > globalExpires) { globalCount = 0; globalExpires = now + WINDOW; }
    if (++bucket.count > 5 || ++globalCount > 100 || buckets.size >= 2000) {
      res.setHeader("Retry-After", String(Math.max(1, Math.ceil((bucket.expires - now) / 1000))));
      reply(res, 429, { ok: false, code: "rate_limit" }); return true;
    }
    buckets.set(ip, bucket);
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      if (Number(req.headers["content-length"]) > MAX_BODY) { reply(res, 413, { ok: false, code: "too_large" }); return true; }
      // Also bound chunked bodies and stalled clients, not only Content-Length.
      const raw = await new Promise<string>((resolve, reject) => {
        const chunks: Buffer[] = [];
        let bytes = 0;
        timer = setTimeout(() => reject(new Error("timeout")), 10_000);
        req.on("data", chunk => {
          bytes += Buffer.byteLength(chunk);
          if (bytes > MAX_BODY) { reject(new Error("too_large")); return; }
          chunks.push(Buffer.from(chunk));
        });
        req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        req.on("error", reject);
        req.on("aborted", () => reject(new Error("aborted")));
      });
      clearTimeout(timer);
      const input = JSON.parse(raw);
      const { data, errors } = validateContact(input);
      if (Object.keys(errors).length) { reply(res, 422, { ok: false, code: "validation", errors }); return true; }
      if (typeof input.website !== "string" || input.website !== "") { reply(res, 422, { ok: false, code: "rejected" }); return true; }
      const key = req.headers["idempotency-key"];
      if (typeof key !== "string" || !/^[\da-f-]{36}$/i.test(key)) { reply(res, 400, { ok: false, code: "request_id" }); return true; }
      const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
      const existing = requests.get(key);
      if (existing && existing.hash !== hash) { reply(res, 409, { ok: false, code: "request_conflict" }); return true; }
      if (!existing && requests.size >= 2000) { reply(res, 503, { ok: false, code: "busy" }); return true; }
      const work = existing?.work ?? (async (): Promise<Reply> => {
        try {
          const response = await sendFetch("https://api.resend.com/emails", {
            method: "POST", signal: AbortSignal.timeout(10_000),
            headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `sykr4-${key}` },
            body: JSON.stringify({ from: config.from, to: [config.to], reply_to: data.email, subject: "Nueva consulta · SYKR4", text: `Nombre: ${data.name}\nCorreo: ${data.email}\nEmpresa: ${data.company || "No indicada"}\nServicios: ${data.services.join(", ") || "Por definir juntos"}\n\n${data.message}` }),
          });
          const result = await response.json();
          if (!response.ok || typeof result.id !== "string" || !result.id) return { status: 502, body: { ok: false, code: "provider" } };
          return { status: 202, body: { ok: true, id: result.id, accepted: true } };
        } catch { return { status: 502, body: { ok: false, code: "provider" } }; }
      })();
      if (!existing) requests.set(key, { hash, expires: now + DAY, work });
      const result = await work;
      // Retrying an uncertain provider result uses the SAME provider idempotency key.
      if (result.status !== 202) requests.delete(key);
      reply(res, result.status, result.body);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "invalid";
      reply(res, reason === "too_large" ? 413 : reason === "timeout" ? 408 : 400, { ok: false, code: "invalid_request" });
    } finally { clearTimeout(timer); }
    return true;
  };
}

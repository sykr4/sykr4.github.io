import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/scroll";
import { addFrame, pointer } from "@/lib/loop";
import { getDeviceProfile } from "@/lib/device";
import { HELP_OPTIONS } from "@/data/content";
import { Magnetic, RollText, SectionLabel } from "@/components/ui";
import { ArrowUpRight, Check } from "@/components/icons";
import { cn } from "@/utils/cn";
import { Astronaut, type AstronautCue } from "@/components/Astronaut";
import { CONTACT_LIMITS, validateContact } from "../../shared/contact";

const offlineMode = import.meta.env.VITE_CONTACT_MODE;
const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim() || (offlineMode === "download" || offlineMode === "email" ? "" : "/api/contact");
const configuredEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim() || "";
const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "";
type ContactStatus = "idle" | "sending" | "sent" | "email" | "prepared" | "error";

/** Titular cuyas letras reaccionan a la proximidad del cursor (solo transform + color: sin reflow) */
function ProximityHeading({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || getDeviceProfile().touch || getDeviceProfile().reducedMotion) return;
    const chars = Array.from(el.querySelectorAll<HTMLSpanElement>(".px-char"));
    let centers: { x: number; y: number }[] = [];
    const measure = () => {
      centers = chars.map((c) => ({ x: c.offsetLeft + c.offsetWidth / 2, y: c.offsetTop + c.offsetHeight / 2 }));
    };
    measure();
    document.fonts?.ready.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const vals = chars.map(() => 0);
    const off = addFrame(() => {
      if (!visible) return;
      const r = el.getBoundingClientRect();
      for (let i = 0; i < chars.length; i++) {
        const dx = pointer.x - (r.left + centers[i].x);
        const dy = pointer.y - (r.top + centers[i].y);
        const target = Math.max(0, 1 - Math.hypot(dx, dy) / 170);
        vals[i] += (target - vals[i]) * 0.15;
        const f = vals[i];
        const s = chars[i].style;
        if (f < 0.002) {
          if (s.transform) {
            s.transform = "";
            s.color = "";
          }
          continue;
        }
        s.transform = `translate3d(0, ${(-f * 0.12).toFixed(3)}em, 0) scale(${(1 + f * 0.26).toFixed(3)})`;
        s.color = `rgb(${Math.round(233 - 141 * f)}, ${Math.round(236 + 6 * f)}, ${Math.round(243 + 12 * f)})`;
      }
    });
    return () => {
      off();
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <h2 ref={ref} aria-label={text} className={cn("relative", className)}>
      {text.split(" ").map((w, wi) => (
        <span key={wi} aria-hidden className="mr-[0.22em] inline-block whitespace-nowrap">
          {w.split("").map((ch, ci) => (
            <span key={ci} className="px-char inline-block origin-bottom will-change-transform">
              {ch}
            </span>
          ))}
        </span>
      ))}
    </h2>
  );
}

function Field({
  name,
  label,
  type = "text",
  textarea = false,
  error,
  className,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  textarea?: boolean;
  error?: string;
  className?: string;
  autoComplete?: string;
}) {
  const common = {
    id: name,
    name,
    placeholder: " ",
    autoComplete,
    maxLength: name === "nombre" ? CONTACT_LIMITS.name : name === "email" ? CONTACT_LIMITS.email : name === "empresa" ? CONTACT_LIMITS.company : CONTACT_LIMITS.message,
    required: name !== "empresa",
    "aria-invalid": !!error,
    "aria-describedby": error ? `${name}-err` : undefined,
    className:
      "peer w-full resize-none border-0 border-b border-white/15 bg-transparent px-0 pb-3 pt-6 text-lg text-bone outline-none transition-colors placeholder:text-transparent focus:border-transparent",
  };
  return (
    <div data-field={name} className={cn("relative", className)}>
      {textarea ? <textarea rows={4} {...common} /> : <input type={type} {...common} />}
      <label
        htmlFor={name}
        className="pointer-events-none absolute left-0 top-0 origin-left scale-75 text-lg text-mute transition-all duration-300 ease-out-expo peer-placeholder-shown:top-6 peer-placeholder-shown:scale-100 peer-focus:top-0 peer-focus:scale-75 peer-focus:text-volt"
      >
        {label}
      </label>
      <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-volt transition-transform duration-500 ease-out-expo peer-focus:scale-x-100" />
      {error && (
        <p id={`${name}-err`} className="mt-2 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}

/** CONTACTO — estado "Portal" de fondo, formulario con microinteracciones */
export function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const identityRef = useRef<{ payload: string; key: string; accepted: boolean } | null>(null);
  const mountedRef = useRef(false);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [help, setHelp] = useState<string[]>([]);
  const [astronautCue, setAstronautCue] = useState<AstronautCue>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    if (contactEndpoint !== "/api/contact") return;
    const controller = new AbortController();
    fetch("/api/contact/status", { signal: controller.signal })
      .then(response => response.ok ? response.json() : { available: false })
      .then(result => { if (!controller.signal.aborted) setAvailable(result.available === true); })
      .catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const selectService = (event: Event) => {
      const service = (event as CustomEvent<string>).detail;
      if (HELP_OPTIONS.includes(service)) setHelp((previous) => previous.includes(service) ? previous : [...previous, service]);
    };
    window.addEventListener("sykr4:select-service", selectService);
    return () => window.removeEventListener("sykr4:select-service", selectService);
  }, []);

  const gesture = (type: "wave" | "wrist") => setAstronautCue((previous) => ({ gesture: type, sequence: (previous?.sequence ?? 0) + 1 }));
  const toggle = (h: string) => {
    setHelp((prev) => (prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]));
    if (status !== "sending") setStatus("idle");
    gesture("wrist");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || requestRef.current) return;
    const fd = new FormData(form);
    const { data, errors: errs } = validateContact({ name: fd.get("nombre"), email: fd.get("email"), company: fd.get("empresa"), message: fd.get("mensaje"), services: help });
    setErrors(errs);
    if (Object.keys(errs).length) {
      if (!getDeviceProfile().reducedMotion) Object.keys(errs).forEach((k) => gsap.fromTo(`[data-field="${k}"]`, { x: -12 }, { x: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" }));
      form.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    const body = [
      "Hola, equipo SYKR4:",
      "",
      `Nombre: ${String(fd.get("nombre")).trim()}`,
      `Correo: ${String(fd.get("email")).trim()}`,
      `Empresa: ${String(fd.get("empresa") ?? "").trim() || "No indicada"}`,
      `Servicios: ${help.join(", ") || "Por definir juntos"}`,
      "",
      String(fd.get("mensaje")).trim(),
    ].join("\n");
    if (contactEndpoint) {
      const payload = JSON.stringify({ ...data, website: String(fd.get("website") ?? "") });
      if (identityRef.current?.payload !== payload) identityRef.current = { payload, key: crypto.randomUUID(), accepted: false };
      const identity = identityRef.current;
      if (identity.accepted) { setStatus("sent"); return; }
      const controller = new AbortController();
      requestRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      setStatus("sending");
      try {
        const response = await fetch(contactEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": identity.key },
          body: payload,
          signal: controller.signal,
        });
        // Require an explicit acknowledgement; a SPA's HTML fallback is never a successful send.
        const result = await response.json();
        if (!response.ok || result.ok !== true || (contactEndpoint === "/api/contact" && !result.id)) {
          if (result.code === "validation" && result.errors) setErrors(result.errors);
          throw new Error(result.code === "unconfigured" ? "El envío todavía no está conectado. Tu consulta no se ha enviado; conservamos los datos en este formulario." : result.code === "rate_limit" ? "Has realizado varios intentos. Espera diez minutos antes de volver a enviar; conservamos tus datos." : "No hemos podido confirmar el envío. Conservamos tu mensaje para que puedas volver a intentarlo.");
        }
        if (!mountedRef.current) return;
        identity.accepted = true;
        setStatus("sent");
        gesture("wave");
      } catch (error) {
        if (mountedRef.current) {
          setSendError(error instanceof Error && !["AbortError", "TypeError", "SyntaxError"].includes(error.name) ? error.message : "No hemos podido confirmar el envío. Conservamos tu mensaje para que puedas volver a intentarlo.");
          setStatus("error");
        }
      } finally {
        window.clearTimeout(timeout);
        requestRef.current = null;
      }
      return;
    }
    if (contactEmail) {
      window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Nueva consulta · SYKR4")}&body=${encodeURIComponent(body)}`;
      setStatus("email");
      gesture("wave");
      return;
    }
    // No destination was supplied: let visitors keep their request without claiming delivery.
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const download = document.createElement("a");
    download.href = url;
    download.download = "Consulta-SYKR4.txt";
    document.body.appendChild(download);
    download.click();
    download.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("prepared");
    gesture("wave");
  };

  return (
    <section id="contacto" data-gl-state="5" className="relative px-5 pb-24 pt-28 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel index="07" label="Hablemos de tu proyecto" />
        <ProximityHeading
          text="Cuéntanos qué necesita tu empresa."
          className="mt-8 max-w-6xl font-display text-[clamp(1.75rem,5.6vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.045em]"
        />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
          <div className="space-y-6">
            <p className="max-w-lg text-[16px] leading-relaxed text-mute">
              Explícanos qué tarea te quita tiempo, qué sistema te da problemas o qué quieres poner en marcha. Revisaremos el punto de partida contigo y definiremos qué solución tiene sentido.
            </p>
            <Astronaut cue={astronautCue} />
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Contacto directo con el equipo
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Alcance, precio y plazo definidos
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Decides con una propuesta clara
              </li>
            </ul>
          </div>

          <form ref={formRef} onSubmit={submit} onChange={() => { if (status !== "sending") setStatus("idle"); }} aria-busy={status === "sending"} noValidate className="relative rounded-[32px] border border-white/10 bg-ink-2/85 p-6 md:p-10">
            <h3 className="font-display text-lg font-medium tracking-tight">Empecemos por el problema</h3>
            <p className="mb-7 mt-2 text-sm leading-relaxed text-mute">No necesitas un documento técnico. Cuéntanos cómo trabajáis y qué os gustaría mejorar.</p>
            {available === false && <p className="mb-6 text-sm text-rose-300" role="status">El formulario aún no está disponible para enviar consultas.</p>}
            <fieldset disabled={status === "sending"} className="min-w-0">
            <div hidden aria-hidden="true"><label htmlFor="website">Deja este campo vacío</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
            <div className="grid gap-7 md:grid-cols-2">
              <Field name="nombre" label="Nombre *" error={errors.nombre} autoComplete="name" />
              <Field name="email" type="email" label="Correo electrónico *" error={errors.email} autoComplete="email" />
              <Field name="empresa" label="Empresa (opcional)" error={errors.empresa} autoComplete="organization" className="md:col-span-2" />
            </div>

            <fieldset className="mt-9">
              <legend className="font-mono text-[11px] uppercase tracking-[0.2em] text-mute">¿En qué podemos ayudarte?</legend>
              <div className="mt-4 flex flex-wrap gap-2">
                {HELP_OPTIONS.map((h) => {
                  const on = help.includes(h);
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={status === "sending"}
                      aria-pressed={on}
                      onClick={() => toggle(h)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all duration-300 active:scale-95",
                        on ? "border-volt bg-volt text-ink" : "border-white/15 text-bone/80 hover:border-volt/60 hover:text-bone",
                      )}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {h}
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="ayuda" value={help.join(", ")} />
            </fieldset>

            <Field name="mensaje" label="Cuéntanos tu proyecto *" textarea error={errors.mensaje} className="mt-9" />
            <p className="mt-3 text-xs leading-relaxed text-mute">Qué quieres resolver, con qué herramientas trabajáis y qué os gustaría conseguir. Los campos con * son obligatorios.</p>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
              <p className="max-w-xs text-xs leading-relaxed text-mute">
                {contactEndpoint ? "Utilizaremos tus datos únicamente para responder a tu consulta." : contactEmail ? "Abriremos tu aplicación de correo con la consulta preparada para que puedas revisarla y enviarla." : "Prepararemos tu consulta con los datos que indiques. Podrás revisarla antes de compartirla con SYKR4."}
              </p>
              <div className="relative">
                <Magnetic>
                  <button
                    type="submit"
                    disabled={status === "sending" || status === "sent"}
                    className="contact-submit group relative inline-flex min-h-16 max-w-full items-center gap-3 overflow-hidden rounded-full bg-volt pl-6 pr-2 font-semibold text-ink transition-shadow duration-500 hover:shadow-[0_0_50px_-8px_rgba(214,255,74,0.7)] disabled:opacity-60"
                  >
                    <span aria-hidden className="absolute inset-0 translate-y-[101%] rounded-full bg-bone transition-transform duration-500 ease-out-expo group-hover:translate-y-0" />
                    <span className="relative"><RollText text={status === "sending" ? "Enviando…" : status === "sent" ? "Consulta aceptada" : contactEndpoint ? "Enviar consulta" : contactEmail ? "Abrir correo" : status === "prepared" ? "Preparar otra copia" : "Preparar consulta"} /></span>
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-volt">
                      <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
                    </span>
                  </button>
                </Magnetic>
              </div>
            </div>

            </fieldset>
            <p role="status" aria-live="polite" className={cn("mt-6 text-sm transition-opacity duration-500", status === "error" ? "text-rose-300" : "text-volt", status !== "idle" ? "opacity-100" : "opacity-0")}>
              {status === "prepared" ? "Tu consulta está preparada en un archivo de texto. Todavía no se ha enviado a SYKR4." : status === "email" ? "Continúa en tu aplicación de correo para revisar y enviar la consulta." : status === "sending" ? "Enviando tu consulta…" : status === "sent" ? "Tu consulta se ha aceptado para envío. Gracias por contarnos tu proyecto." : status === "error" ? sendError : ""}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

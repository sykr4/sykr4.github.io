import { useEffect, useRef, useState, type FormEvent } from "react";
import { gsap } from "@/lib/scroll";
import { addFrame, pointer } from "@/lib/loop";
import { getDeviceProfile } from "@/lib/device";
import { HELP_OPTIONS } from "@/data/content";
import { Magnetic, RollText, SectionLabel } from "@/components/ui";
import { ArrowUpRight, Check } from "@/components/icons";
import { cn } from "@/utils/cn";
import { Astronaut, type AstronautCue } from "@/components/Astronaut";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { CONTACT_LIMITS, validateContact } from "../../shared/contact";

const offlineMode = import.meta.env.VITE_CONTACT_MODE;
const contactEndpoint = import.meta.env.VITE_CONTACT_ENDPOINT?.trim() || (offlineMode === "download" || offlineMode === "email" ? "" : "/api/contact");
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";
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
  const tokenRef = useRef("");
  const helpRef = useRef<string[]>([]);
  const turnstileLoadFailedRef = useRef(false);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [help, setHelp] = useState<string[]>([]);
  const [astronautCue, setAstronautCue] = useState<AstronautCue>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [sendError, setSendError] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  helpRef.current = help;

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
      if (HELP_OPTIONS.includes(service)) setHelp((previous) => {
        if (previous.includes(service)) return previous;
        const next = [...previous, service];
        helpRef.current = next;
        return next;
      });
    };
    window.addEventListener("sykr4:select-service", selectService);
    return () => window.removeEventListener("sykr4:select-service", selectService);
  }, []);

  const gesture = (type: "wave" | "wrist") => setAstronautCue((previous) => ({ gesture: type, sequence: (previous?.sequence ?? 0) + 1 }));
  const toggle = (h: string) => {
    setHelp((prev) => {
      const next = prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h];
      helpRef.current = next;
      return next;
    });
    if (status !== "sending" && !turnstileLoadFailedRef.current) setStatus("idle");
    gesture("wrist");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const form = formRef.current;
    if (!form || requestRef.current) return;
    const fd = new FormData(form);
    const selected = helpRef.current;
    const { data, errors: errs } = validateContact({ name: fd.get("nombre"), email: fd.get("email"), company: fd.get("empresa"), message: fd.get("mensaje"), services: selected });
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
      `Servicios: ${selected.join(", ") || "Por definir juntos"}`,
      "",
      String(fd.get("mensaje")).trim(),
    ].join("\n");
    if (contactEndpoint) {
      const website = String(fd.get("website") ?? "");
      const payload = JSON.stringify({ ...data, website });
      if (identityRef.current?.payload !== payload) identityRef.current = { payload, key: crypto.randomUUID(), accepted: false };
      const identity = identityRef.current;
      if (identity.accepted) { setStatus("sent"); return; }
      if (turnstileSiteKey && !tokenRef.current) {
        if (turnstileLoadFailedRef.current) {
          turnstileLoadFailedRef.current = false;
          setTurnstileReset((value) => value + 1);
          setSendError("Volvemos a cargar la comprobación de seguridad. Complétala y pulsa «Enviar consulta» de nuevo; conservamos los datos.");
        } else {
          setSendError("Confirma la comprobación de seguridad antes de enviar. Conservamos los datos.");
        }
        setStatus("error");
        return;
      }
      const attemptToken = turnstileSiteKey ? tokenRef.current : "";
      const controller = new AbortController();
      requestRef.current = controller;
      const timeout = window.setTimeout(() => controller.abort(), 25000);
      setStatus("sending");
      try {
        const response = await fetch(contactEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": identity.key },
          body: JSON.stringify({ ...data, website, ...(turnstileSiteKey ? { turnstileToken: attemptToken } : {}) }),
          signal: controller.signal,
        });
        // Require an explicit acknowledgement; a SPA's HTML fallback is never a successful send.
        const result = await response.json();
        const acceptedId = typeof result?.id === "string" && result.id.length > 0;
        if (!(response.status === 202 && result?.ok === true && result?.accepted === true && acceptedId)) {
          if (response.status === 422 && result?.errors) setErrors(result.errors);
          const retryAfter = typeof response.headers?.get === "function" ? response.headers.get("Retry-After") : "";
          const code = typeof result?.code === "string" ? result.code : "";
          const uncertain = code === "delivery_unknown";
          const message = response.status === 403 && code === "captcha"
            ? "La comprobación de seguridad ha caducado o no es válida. Repítela para enviar la consulta. Conservamos los datos."
            : response.status === 403
              ? "La consulta no se ha enviado: el formulario todavía no acepta envíos desde el navegador. Conservamos los datos."
              : response.status === 429 || code === "rate_limit"
                ? `Has realizado varios intentos. Espera ${retryAfter && /^\d+$/.test(retryAfter) ? `${retryAfter} segundos` : "diez minutos"} antes de volver a enviar; conservamos tus datos.`
                : uncertain
                  ? "No podemos confirmar si la consulta se ha enviado. No se reintentará sola. Conservamos los datos en el formulario."
                  : response.status === 503 && code === "unconfigured"
                    ? "El envío todavía no está conectado. Tu consulta no se ha enviado; conservamos los datos en este formulario."
                    : response.status === 502 || response.status === 503
                      ? "El envío no está disponible en este momento. Conservamos los datos para que puedas intentarlo más tarde."
                      : "No hemos podido confirmar el envío. Conservamos tu mensaje para que puedas volver a intentarlo.";
          throw new Error(message);
        }
        if (!mountedRef.current) return;
        identity.accepted = true;
        setStatus("sent");
        gesture("wave");
      } catch (error) {
        if (mountedRef.current) {
          const name = typeof error === "object" && error && "name" in error && typeof error.name === "string" ? error.name : "";
          const detail = typeof error === "object" && error && "message" in error && typeof error.message === "string" ? error.message : "";
          setSendError(name === "AbortError" || name === "TypeError"
            ? "No podemos confirmar si la consulta se ha enviado. No se reintentará sola. Conservamos los datos en el formulario."
            : name !== "SyntaxError" && detail
              ? detail
              : "No hemos podido confirmar el envío. Conservamos tu mensaje para que puedas volver a intentarlo.");
          setStatus("error");
        }
      } finally {
        window.clearTimeout(timeout);
        if (attemptToken && (!tokenRef.current || tokenRef.current === attemptToken)) {
          tokenRef.current = "";
          if (mountedRef.current) setTurnstileReset((value) => value + 1);
        }
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
              Cuéntanos qué tarea te quita tiempo, qué herramienta te da problemas o qué quieres poner en marcha. Cuando nos compartas tu consulta, estudiaremos contigo por dónde empezar.
            </p>
            <Astronaut cue={astronautCue} />
            <ul className="space-y-3 font-mono text-[11px] uppercase tracking-[0.2em] text-mute">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Contacto directo con el equipo
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Sabes qué incluye, cuánto cuesta y cuándo estará listo
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-volt" /> Decides con una propuesta clara
              </li>
            </ul>
          </div>

          <form ref={formRef} onSubmit={submit} onChange={() => { if (status !== "sending" && !turnstileLoadFailedRef.current) setStatus("idle"); }} aria-busy={status === "sending"} noValidate className="relative rounded-[32px] border border-white/10 bg-ink-2/85 p-6 md:p-10">
            <h3 className="font-display text-lg font-medium tracking-tight">Empecemos por lo que necesitas</h3>
            <p className="mb-7 mt-2 text-sm leading-relaxed text-mute">No necesitas saber de tecnología. Cuéntanos cómo trabaja tu equipo y qué quieres mejorar.</p>
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
            <p className="mt-3 text-xs leading-relaxed text-mute">Explica qué quieres resolver, qué herramientas usa tu equipo y qué resultado buscas. Los campos con * son obligatorios.</p>
            {turnstileSiteKey ? <TurnstileWidget
              siteKey={turnstileSiteKey}
              resetKey={turnstileReset}
              onToken={(token) => {
                tokenRef.current = token;
                if (token) turnstileLoadFailedRef.current = false;
              }}
              onError={() => {
                tokenRef.current = "";
                turnstileLoadFailedRef.current = true;
                setSendError("No hemos podido cargar la comprobación de seguridad. Pulsa «Enviar consulta» para volver a intentarlo. Conservamos los datos.");
                setStatus("error");
              }}
            /> : null}

            <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
              <p className="max-w-xs text-xs leading-relaxed text-mute">
                {contactEndpoint ? "Utilizaremos tus datos únicamente para responder a tu consulta." : contactEmail ? "Abriremos tu aplicación de correo con la consulta preparada para que puedas revisarla y enviarla." : "Descarga tu consulta en un archivo de texto para revisarla y compartirla con SYKR4. Este formulario no la envía."}
              </p>
              <div className="relative">
                <Magnetic>
                  <button
                    type="submit"
                    disabled={status === "sending" || status === "sent"}
                    className="contact-submit group relative inline-flex min-h-16 max-w-full items-center gap-3 overflow-hidden rounded-full bg-volt pl-6 pr-2 font-semibold text-ink transition-shadow duration-500 hover:shadow-[0_0_50px_-8px_rgba(214,255,74,0.7)] disabled:opacity-60"
                  >
                    <span aria-hidden className="absolute inset-0 translate-y-[101%] rounded-full bg-bone transition-transform duration-500 ease-out-expo group-hover:translate-y-0" />
                    <span className="relative"><RollText text={status === "sending" ? "Enviando…" : status === "sent" ? "Consulta aceptada" : contactEndpoint ? "Enviar consulta" : contactEmail ? "Abrir correo" : status === "prepared" ? "Descargar otra copia" : "Preparar consulta"} /></span>
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-volt">
                      <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45" />
                    </span>
                  </button>
                </Magnetic>
              </div>
            </div>

            </fieldset>
            <p role="status" aria-live="polite" className={cn("mt-6 text-sm transition-opacity duration-500", status === "error" ? "text-rose-300" : "text-volt", status !== "idle" ? "opacity-100" : "opacity-0")}>
              {status === "prepared" ? "Tu consulta está lista en el archivo Consulta-SYKR4.txt. Revisa la descarga y compártela con SYKR4 cuando quieras. No se ha enviado automáticamente." : status === "email" ? "Continúa en tu aplicación de correo para revisar y enviar la consulta." : status === "sending" ? "Enviando tu consulta…" : status === "sent" ? "Tu consulta se ha aceptado para envío. Gracias por contarnos tu proyecto." : status === "error" ? sendError : ""}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

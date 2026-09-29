import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, scrollToTarget } from "@/lib/scroll";
import { addFrame, pointer } from "@/lib/loop";
import { useQuality } from "@/lib/quality";
import { GhostButton, PrimaryButton } from "@/components/ui";

const LINES = ["Automatiza", "procesos.", "Conecta sistemas."];

/**
 * HERO — 3D en tiempo real: la "Nube" de partículas (canvas global) reacciona
 * al ratón, al clic y a la velocidad del scroll. El título rota en 3D al salir.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { ready, device } = useQuality();

  // Salida con scroll: cada línea rota y sube a distinta velocidad
  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".hero-line").forEach((line, i) => {
        gsap.to(line, {
          yPercent: -30 - i * 30,
          rotateX: 50 + i * 8,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "85% top", scrub: true },
        });
      });
      gsap.to(".hero-fade", { y: -60, opacity: 0, ease: "none", scrollTrigger: { trigger: ref.current, start: "8% top", end: "55% top", scrub: true } });
      gsap.to(".hero-card", {
        yPercent: (i: number) => -80 - i * 60,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
      });
    },
    { scope: ref },
  );

  // Entrada tras el preloader
  useGSAP(
    () => {
      if (!ready) return;
      const k = device.reducedMotion ? 0.01 : 1;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(".hero-line-inner", { yPercent: 115, rotateX: -80 }, { yPercent: 0, rotateX: 0, duration: 1.8 * k, stagger: 0.12 * k }, 0.05)
        .fromTo(".hero-intro", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 * k, stagger: 0.08 * k }, 0.55 * k)
        .fromTo(".hero-card-inner", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4 * k, stagger: 0.15 * k }, 0.9 * k);
    },
    { scope: ref, dependencies: [ready] },
  );

  // Parallax de las tarjetas HUD con el ratón (profundidad distinta por capa)
  useEffect(() => {
    if (device.touch || device.reducedMotion) return;
    const cards = cardsRef.current ? Array.from(cardsRef.current.querySelectorAll<HTMLElement>(".hero-card-inner")) : [];
    return addFrame(() => {
      cards.forEach((c, i) => {
        const depth = window.innerWidth >= 1024 ? Math.min(i + 1, 2) * 10 : 0;
        c.style.translate = `${(-pointer.nx * depth).toFixed(2)}px ${(pointer.ny * depth).toFixed(2)}px`;
      });
    });
  }, [device.touch, device.reducedMotion]);

  return (
    <section id="inicio" tabIndex={-1} ref={ref} data-gl-state="0" className="relative flex min-h-[100svh] flex-col px-5 pt-28 md:px-10 md:pt-32">
      <div className="hero-content relative z-10 mx-auto w-full max-w-[1400px] flex-1 pb-10">
        <div className="hero-fade">
          <p className="hero-intro mb-6 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-volt shadow-[0_0_12px_#d6ff4a]" />
            SYKR4 · IA, cloud, seguridad y desarrollo
          </p>
        </div>

        <h1 aria-label="Automatiza procesos. Conecta sistemas." className="font-display text-[clamp(1.65rem,5.3vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.045em] [perspective:900px]">
          {LINES.map((l, i) => (
            <span key={l} aria-hidden className="hero-line -mb-[0.05em] block origin-[50%_100%] overflow-hidden pb-[0.12em] will-change-transform">
              <span className={`hero-line-inner block origin-[50%_100%] will-change-transform ${i === 2 ? "text-gradient" : ""}`}>{l}</span>
            </span>
          ))}
        </h1>

      {/* Espacio propio para los indicadores; las acciones quedan en otra fila. */}
      <div ref={cardsRef} className="hero-hud pointer-events-none">
        <div className="hero-card">
          <div className="hero-card-inner rounded-2xl border border-white/10 bg-ink/75 p-4 shadow-[0_20px_60px_-20px_rgba(92,242,255,0.25)]">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute">
              <span>Ahorro cloud</span><span className="text-volt">● Real</span>
            </div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">−40%</div>
            <svg aria-hidden="true" viewBox="0 0 200 60" className="mt-2 h-9 w-full" fill="none">
              <defs><linearGradient id="hero-cloud-spark" x1="0" y1="0" x2="200" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#8b5cff" /><stop offset="1" stopColor="#5cf2ff" /></linearGradient></defs>
              <polyline points="0,8 25,12 50,10 75,22 100,24 125,33 150,39 175,47 200,52" stroke="url(#hero-cloud-spark)" strokeWidth="2.2" className="animate-dash" />
            </svg>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Gasto anual en AWS</p>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-inner rounded-2xl border border-white/10 bg-ink/75 p-4 shadow-[0_20px_60px_-20px_rgba(139,92,255,0.3)]">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute"><span>Servidores</span><span>1 panel</span></div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">200+</div>
            <div aria-hidden="true" className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }, (_, i) => <span key={i} className={`animate-blink h-2 rounded-[2px] ${i % 7 === 0 ? "bg-volt" : "bg-cyan/70"}`} style={{ animationDelay: `${((i * 37) % 11) / 10}s` }} />)}
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Gestionados por el equipo</p>
          </div>
        </div>
        <div className="hero-card hero-card-automation">
          <div className="hero-card-inner rounded-2xl border border-volt/20 bg-ink/75 p-4 shadow-[0_20px_60px_-20px_rgba(183,255,69,0.2)]">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute"><span>Automatización</span><span className="text-volt">● Conecta</span></div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">IA <span className="text-volt">+</span> APIs</div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-bone/80">
              <span className="rounded border border-cyan/30 bg-cyan/10 px-2 py-1.5">Entrada</span><span className="h-px min-w-2 flex-1 bg-linear-to-r from-cyan to-volt" /><span className="rounded border border-volt/30 bg-volt/10 px-2 py-1.5">Proceso</span><span className="h-px min-w-2 flex-1 bg-volt/50" /><span className="text-volt">✓</span>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-mute">Menos tareas manuales</p>
          </div>
        </div>
      </div>

        <div className="hero-actions hero-fade mt-8 grid gap-7 md:mt-10 md:grid-cols-[minmax(0,470px)_auto] md:items-end md:justify-between">
          <p className="hero-intro max-w-[470px] text-[15px] leading-relaxed text-mute md:text-[17px]">
            Diseñamos webs y herramientas, conectamos tus aplicaciones y automatizamos el trabajo repetitivo. Revisamos AWS, los costes de IA y la seguridad de Microsoft 365 para que decidas qué mejorar y cómo hacerlo.
          </p>
          <div className="hero-intro flex flex-wrap items-center gap-3">
            <PrimaryButton label="Hablemos de tu proyecto" onClick={() => scrollToTarget("#contacto")} />
            <GhostButton label="Ver servicios" onClick={() => scrollToTarget("#servicios")} />
          </div>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="hero-fade relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 border-t border-white/10 py-5 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
        <span className="hidden md:block">IA · AWS · Seguridad · Desarrollo · Web</span>
        <button onClick={() => scrollToTarget("#manifiesto")} className="flex items-center gap-3 transition-colors hover:text-bone">
          <span className="relative flex h-7 w-4 justify-center rounded-full border border-white/25">
            <span className="animate-wheel mt-1.5 h-1.5 w-px bg-bone" />
          </span>
          Descubre cómo podemos ayudarte
        </button>
        <span className="hidden lg:block">Alcance, precio y plazo acordados</span>
      </div>
    </section>
  );
}

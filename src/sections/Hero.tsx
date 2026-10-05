import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, scrollToTarget } from "@/lib/scroll";
import { addFrame, pointer } from "@/lib/loop";
import { useQuality } from "@/lib/quality";
import { useMediaQuery } from "@/lib/hooks";
import { GhostButton, PrimaryButton } from "@/components/ui";

const LINES = ["Automatiza", "procesos.", "Conecta sistemas."];

/**
 * HERO — recupera la composición editorial de la primera versión: el titular
 * vuelve a ser el protagonista y las métricas flotan alrededor sin robarle
 * anchura. En móvil se eliminan los paneles decorativos para mantener foco,
 * legibilidad y rendimiento.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { ready, device } = useQuality();
  const showDecor = useMediaQuery("(min-width: 1280px)");

  useGSAP(
    () => {
      if (device.reducedMotion) return;
      gsap.utils.toArray<HTMLElement>(".hero-line").forEach((line, i) => {
        gsap.to(line, {
          yPercent: -28 - i * 26,
          rotateX: 46 + i * 7,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "82% top", scrub: true },
        });
      });
      gsap.to(".hero-fade", {
        y: -54,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: ref.current, start: "8% top", end: "55% top", scrub: true },
      });
      if (showDecor) {
        gsap.to(".hero-card", {
          yPercent: (i: number) => -62 - i * 38,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top top", end: "bottom top", scrub: true },
        });
      }
    },
    { scope: ref, dependencies: [device.reducedMotion, showDecor], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (!ready) return;
      const k = device.reducedMotion ? 0.01 : 1;
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo(
        ".hero-line-inner",
        { yPercent: 115, rotateX: -80 },
        { yPercent: 0, rotateX: 0, duration: 1.75 * k, stagger: 0.12 * k },
        0.05,
      )
        .fromTo(".hero-intro", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.25 * k, stagger: 0.07 * k }, 0.48 * k)
        .fromTo(".hero-card-inner", { scale: 0.88, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.25 * k, stagger: 0.12 * k }, 0.78 * k);
    },
    { scope: ref, dependencies: [ready] },
  );

  useEffect(() => {
    if (device.touch || device.reducedMotion || !showDecor) return;
    const cards = cardsRef.current ? Array.from(cardsRef.current.querySelectorAll<HTMLElement>(".hero-card-inner")) : [];
    return addFrame(() => {
      cards.forEach((card, i) => {
        const depth = 8 + i * 6;
        card.style.translate = `${(-pointer.nx * depth).toFixed(2)}px ${(pointer.ny * depth).toFixed(2)}px`;
      });
    });
  }, [device.touch, device.reducedMotion, showDecor]);

  return (
    <section id="inicio" tabIndex={-1} ref={ref} data-gl-state="0" className="relative flex min-h-[100svh] flex-col px-5 pt-28 md:px-10 md:pt-32">
      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end pb-9 lg:justify-center lg:pb-3">
        <div className="hero-fade">
          <p className="hero-intro mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-mute sm:text-[11px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-volt shadow-[0_0_12px_#d6ff4a]" />
            SYKR4 · Tecnología para tu empresa
          </p>
        </div>

        <h1 aria-label="Automatiza tareas. Conecta tus herramientas." className="max-w-[1150px] font-display text-[clamp(2.35rem,7.6vw,8.2rem)] font-semibold leading-[0.92] tracking-[-0.055em] [perspective:900px]">
          {LINES.map((line, i) => (
            <span key={line} aria-hidden className="hero-line -mb-[0.045em] block origin-[50%_100%] overflow-hidden pb-[0.11em] will-change-transform">
              <span className={`hero-line-inner block origin-[50%_100%] will-change-transform ${i === 2 ? "text-gradient" : ""}`}>{line}</span>
            </span>
          ))}
        </h1>

        <div className="hero-fade mt-7 grid gap-6 md:mt-9 md:grid-cols-[minmax(0,520px)_auto] md:items-end md:justify-between">
          <p className="hero-intro max-w-[520px] text-[15px] leading-relaxed text-mute md:text-[17px]">
            Creamos webs y aplicaciones, conectamos las herramientas que ya usas y automatizamos tareas repetitivas. También revisamos tus servicios en la nube de Amazon (AWS), el gasto en inteligencia artificial y la seguridad de Microsoft 365 para que sepas qué mejorar y por dónde empezar.
          </p>
          <div className="hero-intro flex flex-wrap items-center gap-3">
            <PrimaryButton label="Hablemos de tu proyecto" onClick={() => scrollToTarget("#contacto")} />
            <GhostButton label="Ver servicios" onClick={() => scrollToTarget("#servicios")} />
          </div>
        </div>
      </div>

      <div ref={cardsRef} aria-hidden className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
        <div className="hero-card absolute right-[5.5%] top-[18%]">
          <div className="hero-card-inner w-56 rounded-2xl border border-white/10 bg-ink/78 p-4 shadow-[0_20px_60px_-20px_rgba(92,242,255,0.25)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute"><span>Ahorro cloud</span><span className="text-volt">● Caso real</span></div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">−40%</div>
            <svg aria-hidden="true" viewBox="0 0 200 60" className="mt-2 h-9 w-full" fill="none">
              <defs><linearGradient id="hero-cloud-spark" x1="0" y1="0" x2="200" y2="60" gradientUnits="userSpaceOnUse"><stop stopColor="#8b5cff" /><stop offset="1" stopColor="#5cf2ff" /></linearGradient></defs>
              <polyline points="0,8 25,12 50,10 75,22 100,24 125,33 150,39 175,47 200,52" stroke="url(#hero-cloud-spark)" strokeWidth="2.2" className="animate-dash" />
            </svg>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Reducción del gasto anual en AWS</p>
          </div>
        </div>

        <div className="hero-card absolute bottom-[18%] right-[29%]">
          <div className="hero-card-inner w-60 rounded-2xl border border-white/10 bg-ink/78 p-4 shadow-[0_20px_60px_-20px_rgba(139,92,255,0.3)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute"><span>Servidores gestionados</span><span>1 panel</span></div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">200+</div>
            <div className="mt-3 grid grid-cols-10 gap-1">
              {Array.from({ length: 30 }, (_, i) => <span key={i} className={`animate-blink h-2 rounded-[2px] ${i % 7 === 0 ? "bg-volt" : "bg-cyan/70"}`} style={{ animationDelay: `${((i * 37) % 11) / 10}s` }} />)}
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Gestionados por el equipo</p>
          </div>
        </div>

        <div className="hero-card absolute right-[4%] top-[55%]">
          <div className="hero-card-inner w-64 rounded-2xl border border-volt/20 bg-ink/78 p-4 shadow-[0_20px_60px_-20px_rgba(183,255,69,0.2)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-mute"><span>Automatización</span><span className="text-volt">● Conecta</span></div>
            <div className="mt-2 font-display text-3xl font-semibold tracking-tight">IA <span className="text-volt">+</span> APIs</div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.08em] text-bone/80">
              <span className="rounded border border-cyan/30 bg-cyan/10 px-2 py-1.5">Datos</span><span className="h-px min-w-2 flex-1 bg-linear-to-r from-cyan to-volt" /><span className="rounded border border-volt/30 bg-volt/10 px-2 py-1.5">Tarea</span><span className="text-volt">✓</span>
            </div>
            <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-mute">Menos tareas manuales</p>
          </div>
        </div>
      </div>

      <div className="hero-fade relative z-10 mx-auto flex w-full max-w-[1400px] items-center justify-between gap-6 border-t border-white/10 py-5 font-mono text-[9px] uppercase tracking-[0.16em] text-mute sm:text-[10px] sm:tracking-[0.2em]">
        <span className="hidden md:block">IA · AWS · Seguridad · Desarrollo · Web</span>
        <button onClick={() => scrollToTarget("#manifiesto")} className="flex items-center gap-3 text-left transition-colors hover:text-bone">
          <span className="relative flex h-7 w-4 shrink-0 justify-center rounded-full border border-white/25"><span className="animate-wheel mt-1.5 h-1.5 w-px bg-bone" /></span>
          Descubre cómo podemos ayudarte
        </button>
        <span className="hidden lg:block">Alcance, precio y plazo acordados</span>
      </div>
    </section>
  );
}

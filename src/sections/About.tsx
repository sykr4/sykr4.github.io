import { useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/scroll";
import { useQuality } from "@/lib/quality";
import { PILLARS } from "@/data/content";
import { RevealWords, SectionLabel } from "@/components/ui";
import { cn } from "@/utils/cn";

/**
 * NOSOTROS — perfiles reales sobre una composición gráfica, con luz que sigue
 * al cursor, revelado con scroll y pilares interactivos.
 */
export function About() {
  const ref = useRef<HTMLElement>(null);
  const imgWrap = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(0);
  const { device } = useQuality();

  useGSAP(
    () => {
      gsap.fromTo(".about-orbit", { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: imgWrap.current, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.fromTo(
        imgWrap.current,
        { clipPath: "inset(100% 0% 0% 0% round 32px)" },
        { clipPath: "inset(0% 0% 0% 0% round 32px)", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: imgWrap.current, start: "top 85%", once: true } },
      );
    },
    { scope: ref },
  );

  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = imgWrap.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--rx", `${e.clientX - r.left}px`);
    el.style.setProperty("--ry", `${e.clientY - r.top}px`);
  };
  const setRadius = (v: string) => imgWrap.current?.style.setProperty("--rr", v);
  const mask = device.touch ? undefined : "radial-gradient(circle var(--rr) at var(--rx, 50%) var(--ry, 50%), #000 55%, transparent 100%)";

  return (
    <section id="nosotros" ref={ref} data-gl-state="4" className="relative px-5 py-32 md:px-10">
      <div className="mx-auto grid max-w-[1400px] gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
        <div
          ref={imgWrap}
          onPointerMove={onMove}
          onPointerEnter={() => setRadius("200px")}
          onPointerLeave={() => setRadius("0px")}
          data-cursor="Hola"
          className="relative h-auto min-h-[600px] overflow-hidden rounded-[32px] border border-white/10 bg-ink-2"
          style={{ transition: "--rr 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div
            aria-hidden
            className="about-orbit pointer-events-none absolute -right-1/4 -top-1/4 aspect-square w-[120%] rounded-full border border-white/10 bg-[radial-gradient(circle,rgba(183,255,69,0.08),transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(92,242,255,0.2),transparent_65%)]"
            style={{ WebkitMaskImage: mask, maskImage: mask }}
          />
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:48px_48px]" />
          <div className="relative flex min-h-[600px] flex-col p-5 sm:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Equipo multidisciplinar</p>
            <p className="mt-4 max-w-sm font-display text-[clamp(1.6rem,3vw,2.7rem)] font-medium leading-[1.06] tracking-[-0.035em]">Liderazgo técnico en cada proyecto.</p>
            <div className="my-auto grid gap-4 py-6">
              <div className="rounded-2xl border border-white/15 bg-ink/70 p-4 backdrop-blur-sm sm:p-5">
                <p className="text-[11px] font-medium leading-relaxed text-cyan">Responsable de arquitectura y seguridad</p>
                <p className="mt-2 font-display text-2xl font-medium tracking-[-0.03em]">Enrique Acón</p>
                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                  <span className="font-display text-4xl font-medium leading-none tracking-[-0.04em] text-bone">10</span>
                  <span className="max-w-[7rem] text-xs leading-snug text-bone/80">años de experiencia</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mute">Sistemas, arquitectura AWS, costes cloud, ciberseguridad y Microsoft 365.</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-ink/70 p-4 backdrop-blur-sm sm:p-5">
                <p className="text-[11px] font-medium leading-relaxed text-cyan">Responsable de desarrollo e integraciones</p>
                <p className="mt-2 font-display text-2xl font-medium tracking-[-0.03em]">Javier Millán</p>
                <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                  <span className="font-display text-4xl font-medium leading-none tracking-[-0.04em] text-bone">5</span>
                  <span className="max-w-[7rem] text-xs leading-snug text-bone/80">años de experiencia</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-mute">Programación, sistemas, aplicaciones web e integración de plataformas mediante APIs.</p>
              </div>
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mute">Experiencia · Visión conjunta · Trato directo</p>
          </div>
        </div>

        <div>
          <SectionLabel index="05" label="Nosotros" />
          <RevealWords
            as="h2"
            text="Experiencia al frente de tu proyecto."
            highlight={["proyecto."]}
            className="mt-8 font-display text-[clamp(2.1rem,4.2vw,4rem)] font-semibold leading-[1.03] tracking-[-0.04em]"
          />
          <p className="mt-8 max-w-lg text-[17px] leading-relaxed text-mute">
            En SYKR4 reunimos experiencia en sistemas, arquitectura cloud, seguridad y desarrollo. Un equipo multidisciplinar para abordar tu proyecto con una visión completa, desde el proceso de negocio hasta la tecnología que lo sostiene.
          </p>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-mute">
            Enrique y Javier están al frente de las áreas técnicas. Aportan criterio para definir prioridades, coordinar las distintas especialidades y acompañarte desde las primeras decisiones hasta la puesta en marcha.
          </p>

          <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {PILLARS.map((p, i) => (
              <button
                key={p.title}
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                aria-expanded={open === i}
                className="group block w-full py-6 text-left"
              >
                <div className="flex items-center justify-between gap-6">
                  <span className={cn("font-display text-2xl font-medium tracking-[-0.03em] transition-colors duration-500 md:text-3xl", open === i ? "text-bone" : "text-bone/45")}>
                    {p.title}
                  </span>
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-500",
                      open === i ? "rotate-45 border-cyan/70 text-cyan" : "border-white/15 text-mute",
                    )}
                  >
                    +
                  </span>
                </div>
                <div className="grid transition-[grid-template-rows] duration-700 ease-out-expo" style={{ gridTemplateRows: open === i ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <p className="max-w-md pt-3 leading-relaxed text-mute">{p.text}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

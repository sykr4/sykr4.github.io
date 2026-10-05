import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/scroll";
import { addFrame } from "@/lib/loop";
import { useInView, useInViewRef, useMediaQuery } from "@/lib/hooks";
import { useQuality } from "@/lib/quality";
import { ImageDistort } from "@/gl/ImageDistort";
import { CASES } from "@/data/content";
import { RevealWords, SectionLabel } from "@/components/ui";
import { cn } from "@/utils/cn";

/**
 * CASOS — lista con scroll + panel sticky WebGL (transición líquida,
 * lente y separación RGB según la velocidad del ratón). Estado "IA" de fondo.
 * Móvil / eco: imágenes nativas con parallax (sin WebGL extra).
 */
export function Cases() {
  const [active, setActive] = useState(0);
  const desktop = useMediaQuery("(min-width: 1024px) and (hover: hover)");
  const { device, eco } = useQuality();
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".case-item").forEach((el, i) => {
        ScrollTrigger.create({ trigger: el, start: "top 60%", end: "bottom 40%", onToggle: (self) => self.isActive && setActive(i) });
        gsap.fromTo(
          el.querySelectorAll(".case-anim"),
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.1, ease: "expo.out", stagger: 0.07, scrollTrigger: { trigger: el, start: "top 78%", once: true } },
        );
      });
      gsap.utils.toArray<HTMLElement>(".case-img").forEach((img) => {
        gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
      });
    },
    { scope: sectionRef, dependencies: [desktop], revertOnUpdate: true },
  );

  return (
    <section id="casos" ref={sectionRef} data-gl-state="3" className="relative px-5 py-32 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel index="03" label="Ejemplos" />
        <RevealWords
          as="h2"
          text="Así puede empezar tu proyecto."
          highlight={["proyecto."]}
          className="mt-8 max-w-4xl font-display text-[clamp(2.1rem,4.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.04em]"
        />
        <p className="mt-6 max-w-2xl leading-relaxed text-mute">¿Te resulta familiar alguna de estas situaciones? Son ejemplos de proyectos que podemos estudiar contigo.</p>
      </div>

      <div className="mx-auto mt-16 grid max-w-[1400px] gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
        <div>
          {CASES.map((c, i) => (
            <article
              key={c.id}
              className="case-item relative flex flex-col justify-center border-t border-white/10 py-14 lg:min-h-[78vh]"
              onMouseEnter={() => setActive(i)}
            >
              <div className="case-anim flex flex-wrap items-center gap-4 font-mono text-xs text-mute">
                <span className={cn("text-cyan transition-opacity duration-500", active === i ? "opacity-100" : "opacity-40")}>{c.index}</span>
                <span className="uppercase tracking-[0.18em]">{c.tag}</span>
                {!c.real && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.18em]">Ejemplo de proyecto</span>}
              </div>
              <h3
                className={`case-anim mt-5 font-display text-[clamp(1.9rem,3.4vw,3.2rem)] font-medium leading-[1.04] tracking-[-0.035em] transition-colors duration-500 ${
                  active === i ? "text-bone" : "text-bone/35"
                }`}
              >
                {c.title}
              </h3>
              <p className="case-anim mt-5 max-w-md leading-relaxed text-mute">{c.text}</p>
              <div className="case-anim mt-8 flex items-end gap-4">
                <span className="text-gradient font-display text-6xl font-semibold tracking-[-0.04em]">{c.metric}</span>
                <span className="max-w-[12rem] pb-2 text-sm text-mute">{c.metricLabel}</span>
              </div>
              <div className="case-anim mt-6 flex flex-wrap gap-2">
                {c.stack.map((t) => (
                  <span key={t} className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-bone/75">
                    {t}
                  </span>
                ))}
              </div>
              {!desktop && (
                <div className="case-anim relative mt-8 aspect-[3/2] overflow-hidden rounded-3xl border border-white/10">
                  <img src={c.image} alt="" loading="lazy" decoding="async" className="case-img absolute inset-x-0 -top-[10%] h-[120%] w-full object-cover" />
                </div>
              )}
            </article>
          ))}
        </div>

        {desktop && (
          <div className="relative">
            <div className="sticky top-[12vh] h-[76vh]">
              <CasesPanel active={active} gl={device.webgl2 && !eco} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function CasesPanel({ active, gl }: { active: number; gl: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fx = useRef<ImageDistort | null>(null);
  const near = useInView(wrapRef, "60% 0px", true);
  const visible = useInViewRef(wrapRef);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Instancia diferida del efecto WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!gl || !near || !canvas) return;
    let inst: ImageDistort;
    try {
      inst = new ImageDistort(canvas, CASES.map((c) => c.image), 1.5);
    } catch {
      return;
    }
    fx.current = inst;
    inst.show(activeRef.current);
    const ro = new ResizeObserver(() => inst.resize());
    if (wrapRef.current) ro.observe(wrapRef.current);
    const off = addFrame((t) => {
      if (visible.current) inst.render(t);
    }, 15);
    return () => {
      off();
      ro.disconnect();
      inst.dispose();
      fx.current = null;
    };
  }, [gl, near, visible]);

  useEffect(() => {
    fx.current?.show(active);
  }, [active]);

  const c = CASES[active];
  return (
    <div
      ref={wrapRef}
      data-cursor="Explorar"
      onPointerMove={(e) => fx.current?.setPointer(e.clientX, e.clientY)}
      onPointerEnter={() => fx.current?.setHover(1)}
      onPointerLeave={() => fx.current?.setHover(0)}
      className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/10 bg-ink-2"
    >
      {gl ? (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
      ) : (
        CASES.map((item, i) => (
          <img
            key={item.id}
            src={item.image}
            alt=""
            loading="lazy"
            decoding="async"
            className={cn("absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out-expo", i === active ? "scale-100 opacity-100" : "scale-110 opacity-0")}
          />
        ))
      )}
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/85 via-transparent to-ink/30" />
      {/* HUD del panel */}
      <div className="pointer-events-none absolute inset-0 p-6 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/75">
        <span className="absolute left-4 top-4 h-4 w-4 border-l border-t border-cyan/70" />
        <span className="absolute right-4 top-4 h-4 w-4 border-r border-t border-cyan/70" />
        <span className="absolute bottom-4 left-4 h-4 w-4 border-b border-l border-cyan/70" />
        <span className="absolute bottom-4 right-4 h-4 w-4 border-b border-r border-cyan/70" />
        <div className="flex justify-between px-4 pt-2">
          <span>Ejemplo {c.index} / 04</span>
          <span className="text-cyan">{c.tag}</span>
        </div>
        <div className="absolute inset-x-10 bottom-10 flex items-end justify-between gap-6">
          <div>
            <div key={c.id} className="font-display text-[clamp(1.7rem,4vw,3rem)] font-semibold normal-case tracking-[-0.04em] text-bone">
              {c.metric}
            </div>
            <div className="mt-2 normal-case tracking-normal text-mute">{c.metricLabel}</div>
          </div>
          <span className="hidden text-right text-mute xl:block">Acordamos contigo qué incluye</span>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/scroll";
import { addFrame, scrollState } from "@/lib/loop";
import { useInViewRef } from "@/lib/hooks";
import { STATS, TECH } from "@/data/content";
import { RevealWords, SectionLabel, trackSpot } from "@/components/ui";

/** Marquee infinito cuya velocidad, dirección e inclinación dependen del scroll */
function Marquee({ items, reverse = false, outline = false }: { items: string[]; reverse?: boolean; outline?: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const visible = useInViewRef(wrapRef, "100px");

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let x = 0;
    let skew = 0;
    let half = track.scrollWidth / 2;
    const ro = new ResizeObserver(() => (half = track.scrollWidth / 2));
    ro.observe(track);
    const off = addFrame((_, dt) => {
      if (!visible.current || half === 0) return;
      const v = scrollState.smooth;
      const dir = (reverse ? -1 : 1) * (scrollState.direction >= 0 ? 1 : -1);
      x -= (45 + Math.min(Math.abs(v) * 18, 900)) * dt * dir;
      if (x <= -half) x += half;
      else if (x > 0) x -= half;
      skew += (Math.max(-12, Math.min(12, -v * 0.35)) - skew) * 0.1;
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    });
    return () => {
      off();
      ro.disconnect();
    };
  }, [reverse, visible]);

  return (
    <div ref={wrapRef} className="relative overflow-hidden border-y border-white/10 py-5 [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        {[0, 1].map((k) => (
          <div key={k} aria-hidden={k === 1} className="flex shrink-0 items-center">
            {items.map((t) => (
              <span
                key={`${t}-${k}`}
                className={`flex items-center font-display text-[clamp(2rem,5vw,4.6rem)] font-medium tracking-[-0.03em] ${outline ? "text-outline" : "text-bone"}`}
              >
                {t}
                <span className="mx-8 text-[0.45em] text-cyan">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** MÉTODO — pasos de trabajo + marquee reactivo. Estado "Órbita" de fondo. */
export function Results() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".stat").forEach((el) => {
        const num = el.querySelector<HTMLElement>(".stat-num");
        if (!num) return;
        const target = Number(num.dataset.value);
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 2,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 82%", once: true },
          onUpdate: () => {
            num.textContent = String(Math.round(obj.v));
          },
        });
        gsap.fromTo(
          el.querySelector(".stat-line"),
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: "left center", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 82%", once: true } },
        );
      });
    },
    { scope: ref },
  );

  return (
    <section id="resultados" ref={ref} data-gl-state="4" className="relative py-32">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionLabel index="04" label="Método" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <RevealWords
            as="h2"
            text="Sabrás qué vamos a hacer. Y qué vas a recibir."
            highlight={["recibir."]}
            className="font-display text-[clamp(2.4rem,6vw,5.6rem)] font-semibold leading-[0.98] tracking-[-0.045em]"
          />
          <p className="max-w-md text-mute lg:justify-self-end">
            Cada proyecto empieza por una necesidad concreta. Acordamos qué incluye, cómo lo comprobaremos y quién se encarga de cada parte. Las ampliaciones y el mantenimiento se definen por separado.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} onPointerMove={trackSpot} className="stat spot relative bg-ink/90 p-8">
              <div className="font-display text-[clamp(3rem,5.4vw,5.2rem)] font-semibold leading-none tracking-[-0.05em]">
                {s.prefix}
                <span className="stat-num tabular-nums" data-value={s.value}>
                  0
                </span>
                <span className="text-cyan">{s.suffix}</span>
              </div>
              <div className="stat-line mt-6 h-px bg-linear-to-r from-cyan to-violet" />
              <p className="mt-4 text-sm leading-relaxed text-mute">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-24 space-y-3">
        <p className="mx-auto max-w-[1400px] px-5 font-mono text-[11px] uppercase tracking-[0.22em] text-mute md:px-10">Tecnologías con las que trabajamos</p>
        <Marquee items={TECH} />
        <Marquee items={[...TECH].reverse()} reverse outline />
      </div>
    </section>
  );
}

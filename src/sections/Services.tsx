import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap, lockScroll, scrollToTarget, ScrollTrigger } from "@/lib/scroll";
import { useMediaQuery } from "@/lib/hooks";
import { SERVICES, type Service } from "@/data/content";
import { PrimaryButton, RevealWords, SectionLabel, TiltCard } from "@/components/ui";
import { ServiceIcon } from "@/components/icons";

interface OriginRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export function Services() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  // The pinned horizontal section needs room for the full service copy.
  // Short laptop/landscape viewports use the normal-flow horizontal cards.
  const desktop = useMediaQuery("(min-width: 1024px) and (min-height: 780px) and (hover: hover)");
  const [height, setHeight] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<OriginRect | null>(null);

  useLayoutEffect(() => {
    if (!desktop) {
      setHeight(null);
      return;
    }
    const measure = () => {
      const track = trackRef.current;
      if (track) setHeight(track.scrollWidth - window.innerWidth + window.innerHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [desktop]);

  useGSAP(
    () => {
      const track = trackRef.current;
      if (!desktop || !height || !track) return;
      const tween = gsap.to(track, {
        x: () => -(track.scrollWidth - window.innerWidth),
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
            if (countRef.current) countRef.current.textContent = String(Math.min(SERVICES.length, Math.floor(self.progress * SERVICES.length) + 1)).padStart(2, "0");
          },
        },
      });
      gsap.utils.toArray<HTMLElement>(".svc-card").forEach((card) => {
        gsap.fromTo(
          card,
          { opacity: 0.2, y: 70, rotateZ: 2.5 },
          { opacity: 1, y: 0, rotateZ: 0, ease: "power2.out", scrollTrigger: { trigger: card, containerAnimation: tween, start: "left 98%", end: "left 62%", scrub: true } },
        );
      });
      ScrollTrigger.refresh();
    },
    { scope: sectionRef, dependencies: [desktop, height], revertOnUpdate: true },
  );

  const openDetail = (index: number, button: HTMLButtonElement) => {
    const r = button.getBoundingClientRect();
    openerRef.current = button;
    setOrigin({ top: r.top, right: window.innerWidth - r.right, bottom: window.innerHeight - r.bottom, left: r.left });
    setActiveIndex(index);
  };

  const intro = (
    <div className={`flex shrink-0 flex-col justify-between gap-10 ${desktop ? "w-[min(520px,40vw)] pr-8" : "w-full"}`}>
      <div>
        <SectionLabel index="02" label="Servicios" />
        <RevealWords
          as="h2"
          text="Encuentra la solución que necesita tu empresa."
          highlight={["solución"]}
          className="mt-8 font-display text-[clamp(2.1rem,4vw,3.9rem)] font-semibold leading-[1.03] tracking-[-0.04em]"
        />
      </div>
      <div>
        <p className="max-w-sm text-mute">Automatizar una tarea, revisar un gasto, proteger datos o crear una web. Explora cada área para ver qué podemos resolver y qué incluye el trabajo.</p>
        <div className={desktop ? "mt-8 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-mute" : "hidden"}>
          <span ref={countRef} className="tabular-nums text-bone">01</span>
          <span className="relative h-px w-40 overflow-hidden bg-white/15">
            <span ref={barRef} className="absolute inset-0 origin-left bg-linear-to-r from-cyan to-violet" style={{ transform: "scaleX(0)" }} />
          </span>
          <span>{String(SERVICES.length).padStart(2, "0")}</span>
          <span className="ml-2 text-bone/60">Sigue explorando →</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section id="servicios" ref={sectionRef} data-gl-state="2" className="relative" style={desktop && height ? { height } : undefined}>
        <div className={desktop ? "sticky top-0 flex h-screen flex-col justify-center overflow-hidden" : "py-28"}>
          {!desktop && <div className="px-5 md:px-10">{intro}</div>}
          <div
            ref={trackRef}
            className={
              desktop
                ? "flex w-max items-stretch gap-6 pl-[6vw] pr-[8vw] pt-16 will-change-transform"
                : "mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 [scrollbar-width:none] md:px-10"
            }
          >
            {desktop && intro}
            {SERVICES.map((s, i) => (
              <TiltCard
                key={s.title}
                className="svc-card group min-h-[560px] w-[min(400px,84vw)] shrink-0 snap-center overflow-hidden rounded-[28px] border border-white/10 bg-ink-2/85 transition-colors focus-within:border-cyan/60"
              >
                <button
                  type="button"
                  onClick={(e) => openDetail(i, e.currentTarget)}
                  aria-haspopup="dialog"
                  data-cursor="Entrar"
                  className="relative flex h-full min-h-[560px] w-full flex-col p-7 text-left"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="shrink-0 font-mono text-xs text-mute">{String(i + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan">{s.metric}</span>
                  </div>
                  <div className="mt-8 text-bone/90 [transform:translateZ(50px)]"><ServiceIcon name={s.icon} className="h-16 w-16" /></div>
                  <h3 className="mt-auto pt-8 font-display text-[1.6rem] font-medium leading-[1.1] tracking-[-0.03em] [transform:translateZ(30px)]">{s.title}</h3>
                  <p className="mt-4 text-base font-medium leading-snug text-cyan">{s.microclaim}</p>
                  <p className="mt-3 text-sm leading-relaxed text-mute">{s.text}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {s.tags.map((t) => <span key={t} className="rounded-full bg-white/[0.05] px-3 py-1 text-[11px] text-bone/75">{t}</span>)}
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 self-start font-mono text-[10px] uppercase tracking-[0.2em] text-bone/55 transition-colors duration-300 group-hover:text-cyan">
                    Ver qué incluye <span aria-hidden>↗</span>
                  </span>
                </button>
              </TiltCard>
            ))}
            <div className="flex w-[min(400px,84vw)] shrink-0 snap-center flex-col justify-center rounded-[28px] border border-dashed border-white/15 p-8">
              <p className="font-display text-3xl font-medium leading-tight tracking-[-0.03em]">¿No sabes por dónde empezar?</p>
              <p className="mt-4 text-mute">Explícanos cómo trabajáis y dónde aparece el problema. Te ayudamos a concretar qué conviene abordar primero.</p>
              <PrimaryButton label="Ayúdame a definirlo" onClick={() => scrollToTarget("#contacto")} className="mt-8" />
            </div>
          </div>
        </div>
      </section>

      {activeIndex !== null && origin && createPortal(
        <ServiceDetail
          service={SERVICES[activeIndex]}
          index={activeIndex}
          origin={origin}
          onClosed={() => {
            setActiveIndex(null);
            requestAnimationFrame(() => openerRef.current?.focus({ preventScroll: true }));
          }}
        />,
        document.body,
      )}
    </>
  );
}

function ServiceDetail({ service, index, origin, onClosed }: { service: Service; index: number; origin: OriginRect; onClosed: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closingRef = useRef(false);
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const startClip = `inset(${Math.max(0, origin.top)}px ${Math.max(0, origin.right)}px ${Math.max(0, origin.bottom)}px ${Math.max(0, origin.left)}px round 28px)`;

  useLayoutEffect(() => {
    const root = overlayRef.current;
    if (!root) return;
    lockScroll(true);
    if (reduced) {
      gsap.set(root, { clipPath: "inset(0px 0px 0px 0px round 0px)" });
      gsap.set(root.querySelectorAll(".sd-reveal"), { autoAlpha: 1, y: 0 });
      closeRef.current?.focus({ preventScroll: true });
      return () => lockScroll(false);
    }
    const ctx = gsap.context(() => {
      gsap.set(root, { clipPath: startClip });
      gsap.set(".sd-reveal", { autoAlpha: 0, y: 46 });
      gsap.set(".sd-orbit", { scale: 0.64, rotate: -9, opacity: 0 });
      gsap.set(".sd-gate-left", { xPercent: 0 });
      gsap.set(".sd-gate-right", { xPercent: 0 });
      gsap.timeline({ onComplete: () => closeRef.current?.focus({ preventScroll: true }) })
        .to(root, { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.88, ease: "expo.inOut" })
        .to(".sd-gate-left", { xPercent: -102, duration: 0.95, ease: "expo.inOut" }, 0.5)
        .to(".sd-gate-right", { xPercent: 102, duration: 0.95, ease: "expo.inOut" }, 0.5)
        .to(".sd-orbit", { scale: 1, rotate: 0, opacity: 0.22, duration: 1.25, ease: "expo.out" }, 0.45)
        .to(".sd-reveal", { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.055 }, 0.74);
    }, root);
    return () => { ctx.revert(); lockScroll(false); };
  }, [reduced, startClip]);

  const close = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = overlayRef.current;
    if (!root || reduced) { lockScroll(false); onClosed(); return; }
    gsap.timeline({ onComplete: () => { lockScroll(false); onClosed(); } })
      .to(root.querySelectorAll(".sd-reveal"), { autoAlpha: 0, y: 24, duration: 0.28, stagger: 0.018, ease: "power2.in" })
      .to(root.querySelector(".sd-orbit"), { opacity: 0, scale: 0.8, duration: 0.35, ease: "power2.in" }, 0)
      .to(root, { clipPath: startClip, duration: 0.78, ease: "expo.inOut" }, 0.14);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !overlayRef.current) return;
      const focusable = Array.from(overlayRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const goContact = () => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = overlayRef.current;
    const finish = () => { window.dispatchEvent(new CustomEvent("sykr4:select-service", { detail: service.title })); lockScroll(false); onClosed(); requestAnimationFrame(() => scrollToTarget("#contacto")); };
    if (!root || reduced) { finish(); return; }
    gsap.to(root, { clipPath: "inset(50% 50% 50% 50% round 999px)", duration: 0.75, ease: "expo.inOut", onComplete: finish });
  };

  return (
    <div ref={overlayRef} role="dialog" aria-modal="true" aria-labelledby="service-detail-title" className="fixed inset-0 z-[95] overflow-hidden bg-ink-2" style={{ clipPath: startClip }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 [background:radial-gradient(70%_70%_at_78%_32%,rgba(92,242,255,0.15),transparent_58%),radial-gradient(60%_70%_at_10%_90%,rgba(139,92,255,0.17),transparent_62%)]" />
        <div className="sd-orbit absolute -right-[14vw] top-1/2 aspect-square w-[min(74vw,920px)] -translate-y-1/2 rounded-full border border-cyan/20 [box-shadow:0_0_90px_rgba(92,242,255,0.08),inset_0_0_90px_rgba(139,92,255,0.06)]">
          <div className="absolute inset-[12%] rounded-full border border-white/10" />
          <div className="absolute inset-[27%] rounded-full border border-violet/25" />
          <ServiceIcon name={service.icon} className="absolute left-1/2 top-1/2 h-[32%] w-[32%] -translate-x-1/2 -translate-y-1/2 text-bone" />
        </div>
        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_right,black,transparent_78%)]" />
        <div className="sd-gate-left absolute inset-y-0 left-0 w-1/2 border-r border-white/10 bg-ink-2" />
        <div className="sd-gate-right absolute inset-y-0 right-0 w-1/2 border-l border-white/10 bg-ink-2" />
      </div>
      <div data-lenis-prevent className="relative z-10 h-full overflow-y-auto px-5 pb-10 pt-5 md:px-10 md:pb-14 md:pt-8">
        <div className="mx-auto flex min-h-full max-w-[1400px] flex-col">
          <div className="sd-reveal flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-mute"><span className="text-cyan">{String(index + 1).padStart(2, "0")} / {String(SERVICES.length).padStart(2, "0")}</span><span className="h-px w-8 bg-white/20" />Servicios SYKR4</div>
            <button ref={closeRef} type="button" onClick={close} aria-label={`Cerrar detalle de ${service.title}`} className="group flex items-center gap-3 rounded-full border border-white/15 py-1.5 pl-4 pr-1.5 text-sm transition-colors hover:border-cyan/60">
              <span className="hidden sm:inline">Cerrar</span><span className="grid h-9 w-9 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 ease-out-expo group-hover:rotate-90">✕</span>
            </button>
          </div>
          <div className="grid flex-1 content-center gap-12 py-[8vh] lg:grid-cols-[minmax(0,.95fr)_minmax(320px,1.05fr)] lg:items-start lg:gap-14">
            <div>
              <div className="sd-reveal inline-flex items-center gap-3 rounded-full border border-cyan/25 bg-cyan/[0.06] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan"><span className="h-1.5 w-1.5 rounded-full bg-cyan" />{service.metric}</div>
              <h2 id="service-detail-title" className="sd-reveal mt-7 max-w-[900px] break-words font-display text-[clamp(1.7rem,4.3vw,4.7rem)] font-semibold leading-[1.05] tracking-[-0.055em]">{service.title}</h2>
              <p className="sd-reveal mt-6 max-w-2xl font-display text-xl leading-snug text-cyan md:text-2xl">{service.microclaim}</p>
              <p className="sd-reveal mt-5 max-w-2xl text-base leading-relaxed text-bone/72 md:text-lg">{service.description}</p>
              <div className="sd-reveal mt-7 border-l-2 border-cyan/60 pl-5"><h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Qué te aporta</h3><p className="mt-3 text-base leading-relaxed text-bone/80">{service.outcome}</p></div>
              <div className="sd-reveal mt-8 flex flex-wrap gap-2.5">{service.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-bone/70">{tag}</span>)}</div>
            </div>
            <aside className="sd-reveal rounded-[28px] border border-white/10 bg-black/20 p-6 backdrop-blur-md md:p-8">
              <div className="flex items-center justify-between gap-5 border-b border-white/10 pb-5"><span className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Qué podemos hacer</span><ServiceIcon name={service.icon} className="h-8 w-8 text-cyan" /></div>
              <ul className="mt-2 divide-y divide-white/10">{service.detailPoints.map((point, i) => <li key={point} className="flex gap-4 py-4 text-sm leading-relaxed text-bone/80 md:text-base"><span className="mt-1 font-mono text-[10px] text-cyan">{String(i + 1).padStart(2, "0")}</span><span>{point.includes(": ") ? <><strong className="font-semibold text-bone">{point.slice(0, point.indexOf(": "))}.</strong>{" "}{point.slice(point.indexOf(": ") + 2)}</> : point}</span></li>)}</ul>
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm leading-relaxed text-mute">{service.scope}</p>
              <button type="button" onClick={goContact} className="group mt-6 flex w-full items-center justify-between rounded-full bg-bone px-5 py-4 font-semibold text-ink transition-transform duration-300 hover:scale-[1.015]"><span className="text-left">{service.cta}</span><span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">↗</span></button>
            </aside>
          </div>
          <div className="sd-reveal flex items-center justify-between border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-mute"><span>SYKR4 · Un proceso claro. Una entrega definida.</span><span className="hidden sm:inline">Esc para volver</span></div>
        </div>
      </div>
    </div>
  );
}

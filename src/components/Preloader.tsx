import { useEffect, useRef, useState } from "react";
import { gsap, lockScroll } from "@/lib/scroll";
import { useQuality } from "@/lib/quality";
import { cn } from "@/utils/cn";
import { LogoMark } from "./icons";

/**
 * Preloader corto (~2 s): presenta las áreas de SYKR4 mientras se preparan
 * las fuentes y la experiencia visual. Sale con un clip-path.
 */
export function Preloader({ onDone }: { onDone: () => void }) {
  const { device } = useQuality();
  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [gone, setGone] = useState(false);

  const logs = [
    "IA y automatización",
    "AWS y control de costes",
    "Seguridad y Microsoft 365",
    "Desarrollo e integraciones",
    "Web y tiendas online",
  ];

  useEffect(() => {
    let cancelled = false;
    lockScroll(true, "preloader");
    const obj = { v: 0 };
    let lastStep = -1;
    const counter = gsap.to(obj, {
      v: 100,
      duration: device.reducedMotion ? 0.4 : 1.9,
      ease: "power2.inOut",
      onUpdate: () => {
        if (countRef.current) countRef.current.textContent = String(Math.round(obj.v)).padStart(3, "0");
        if (barRef.current) barRef.current.style.transform = `scaleX(${obj.v / 100})`;
        const s = Math.min(4, Math.floor((obj.v / 100) * 5));
        if (s !== lastStep) {
          lastStep = s;
          setStep(s);
        }
      },
    });
    const counterDone = new Promise<void>((res) => counter.eventCallback("onComplete", () => res()));
    const fonts = document.fonts ? document.fonts.ready.then(() => undefined) : Promise.resolve();
    const timeout = new Promise<void>((res) => window.setTimeout(res, 4000));
    let tl: gsap.core.Timeline | null = null;

    Promise.all([counterDone, Promise.race([fonts, timeout])]).then(() => {
      if (cancelled) return;
      tl = gsap.timeline({ onComplete: () => !cancelled && setGone(true) });
      tl.to(innerRef.current, { yPercent: -20, opacity: 0, duration: 0.6, ease: "power3.in" })
        .to(rootRef.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" }, "-=0.15")
        .add(() => {
          lockScroll(false, "preloader");
          onDone();
        }, "-=0.85");
    });

    return () => {
      cancelled = true;
      counter.kill();
      tl?.kill();
      lockScroll(false, "preloader");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      role="status"
      aria-live="polite"
      aria-label="Cargando SYKR4"
      className="fixed inset-0 z-[200] flex items-end bg-ink"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(40%_40%_at_70%_35%,rgba(92,242,255,0.10),transparent_70%),radial-gradient(35%_35%_at_25%_70%,rgba(139,92,255,0.12),transparent_70%)]"
      />
      <div ref={innerRef} className="relative w-full px-5 pb-10 md:px-10 md:pb-14">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="font-mono text-[11px] leading-6 text-mute">
            {logs.map((l, i) => (
              <div key={l} className={cn("transition-all duration-500", i <= step ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
                <span className="text-cyan">›</span> {l}
              </div>
            ))}
          </div>
          <div className="flex items-end gap-4">
            <LogoMark className="mb-3 h-10 w-10 text-bone" />
            <span ref={countRef} className="font-display text-[clamp(5rem,16vw,13rem)] font-semibold leading-[0.8] tracking-[-0.05em] tabular-nums">
              000
            </span>
          </div>
        </div>
        <div className="mx-auto mt-8 h-px max-w-[1400px] bg-white/10">
          <div ref={barRef} className="h-full origin-left bg-linear-to-r from-cyan via-violet to-volt" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </div>
  );
}

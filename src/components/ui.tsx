import { createElement, useCallback, useEffect, useRef, type PointerEvent as RPointerEvent, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/scroll";
import { getDeviceProfile } from "@/lib/device";
import { cn } from "@/utils/cn";
import { ArrowUpRight } from "./icons";

/* ----------------------------------------------------------------
   Scramble: texto que se "decodifica" al entrar en pantalla y en hover
----------------------------------------------------------------- */
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#<>_";
export function Scramble({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | null>(null);
  const run = useCallback(() => {
    const el = ref.current;
    if (!el || getDeviceProfile().reducedMotion) return;
    if (timer.current) window.clearInterval(timer.current);
    let frame = 0;
    const total = text.length + 12;
    timer.current = window.setInterval(() => {
      el.textContent = text
        .split("")
        .map((ch, i) => (ch === " " || i < frame - 10 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      if (++frame > total) {
        el.textContent = text;
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
      }
    }, 32);
  }, [text]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [run]);

  return (
    <span ref={ref} className={className} onMouseEnter={run}>
      {text}
    </span>
  );
}

export function SectionLabel({ index, label, className }: { index: string; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.25em] text-mute", className)}>
      <span className="text-cyan">({index})</span>
      <span className="h-px w-10 bg-white/20" />
      <Scramble text={label} />
    </div>
  );
}

/* ----------------------------------------------------------------
   RollText: cada letra sube y es reemplazada por su copia (hover)
----------------------------------------------------------------- */
export function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn("roll relative inline-flex overflow-hidden leading-[1.15]", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="flex">
        {text.split("").map((c, i) => (
          <span key={i} className="roll-char relative inline-block" style={{ transitionDelay: `${i * 16}ms` }}>
            <span className="block">{c === " " ? "\u00A0" : c}</span>
            <span className="absolute left-0 top-full block">{c === " " ? "\u00A0" : c}</span>
          </span>
        ))}
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------
   Magnetic: el elemento es atraído por el cursor y vuelve con inercia
----------------------------------------------------------------- */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || getDeviceProfile().touch) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    };
    const leave = () => {
      xTo(0);
      yTo(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [strength]);
  return (
    <div ref={ref} className={cn("inline-block will-change-transform", className)}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  label,
  onClick,
  type = "button",
  className,
  disabled,
  icon,
}: {
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Magnetic className={className}>
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-volt py-2 pl-6 pr-2 text-[15px] font-semibold text-ink transition-shadow duration-500 hover:shadow-[0_0_48px_-8px_rgba(214,255,74,0.7)] disabled:opacity-80"
      >
        <span aria-hidden className="absolute inset-0 translate-y-[101%] rounded-full bg-bone transition-transform duration-500 ease-out-expo group-hover:translate-y-0" />
        <RollText text={label} className="relative" />
        <span className="relative grid h-9 w-9 place-items-center rounded-full bg-ink text-volt transition-transform duration-500 ease-out-expo group-hover:rotate-45">
          {icon ?? <ArrowUpRight className="h-4 w-4" />}
        </span>
      </button>
    </Magnetic>
  );
}

export function GhostButton({ label, onClick, className }: { label: string; onClick?: () => void; className?: string }) {
  return (
    <Magnetic className={className}>
      <button
        type="button"
        onClick={onClick}
        className="group relative inline-flex items-center overflow-hidden rounded-full border border-white/15 px-6 py-3.5 text-[15px] font-medium text-bone transition-colors duration-500 hover:border-cyan/60"
      >
        <span aria-hidden className="absolute inset-0 origin-bottom scale-y-0 bg-white/[0.06] transition-transform duration-500 ease-out-expo group-hover:scale-y-100" />
        <RollText text={label} className="relative" />
      </button>
    </Magnetic>
  );
}

/** Actualiza --mx/--my para el spotlight y el borde luminoso (.spot) */
export function trackSpot(e: RPointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

/* ----------------------------------------------------------------
   TiltCard: inclinación 3D siguiendo al ratón + spotlight + profundidad
----------------------------------------------------------------- */
export function TiltCard({ children, className, max = 9 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    trackSpot(e);
    if (getDeviceProfile().touch) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    gsap.to(el, { rotateY: (px - 0.5) * max * 2, rotateX: -(py - 0.5) * max * 2, transformPerspective: 1000, duration: 0.6, ease: "power3.out", overwrite: "auto" });
  };
  const onLeave = () => {
    if (ref.current) gsap.to(ref.current, { rotateX: 0, rotateY: 0, duration: 1.1, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
  };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={cn("spot relative [transform-style:preserve-3d]", className)}>
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------
   RevealWords: las palabras suben desde una máscara al entrar en pantalla
----------------------------------------------------------------- */
export function RevealWords({
  text,
  as = "h2",
  className,
  highlight = [],
  delay = 0,
}: {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  highlight?: string[];
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!ref.current || getDeviceProfile().reducedMotion) return;
      gsap.fromTo(
        ref.current.querySelectorAll(".rw-inner"),
        { yPercent: 118, rotate: 5 },
        { yPercent: 0, rotate: 0, duration: 1.2, ease: "expo.out", stagger: 0.05, delay, scrollTrigger: { trigger: ref.current, start: "top 88%", once: true } },
      );
    },
    { scope: ref },
  );
  const words = text.split(" ");
  const children = words.map((w, i) => (
    <span key={i}>
      <span aria-hidden className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-top">
        <span className={cn("rw-inner inline-block origin-bottom-left will-change-transform", highlight.includes(w) && "text-gradient")}>{w}</span>
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
  return createElement(as, { ref, className, "aria-label": text }, children);
}

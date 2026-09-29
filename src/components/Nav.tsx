import { useCallback, useEffect, useRef, useState } from "react";
import { gsap, lockScroll, scrollToTarget, ScrollTrigger } from "@/lib/scroll";
import { useLocalTime } from "@/lib/hooks";
import { useQuality } from "@/lib/quality";
import { MEDIA, NAV } from "@/data/content";
import { cn } from "@/utils/cn";
import { LogoMark } from "./icons";
import { RollText } from "./ui";

const LINKS = [
  { id: "servicios", label: "Servicios" },
  { id: "casos", label: "Ejemplos" },
  { id: "nosotros", label: "Nosotros" },
  { id: "recorrido", label: "Recorrido" },
];

const PREVIEW: Record<string, string> = {
  inicio: "images/case-servers.jpg",
  manifiesto: "images/case-ai.jpg",
  servicios: "images/case-cloud.jpg",
  recorrido: MEDIA.poster,
  casos: "images/case-servers.jpg",
  resultados: "images/case-cloud.jpg",
  nosotros: "",
  contacto: "images/case-digital.jpg",
};

export function Nav() {
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  openRef.current = open;
  const time = useLocalTime();

  // Barra de progreso + ocultar al bajar / mostrar al subir
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (progRef.current) progRef.current.style.transform = `scaleX(${self.progress.toFixed(4)})`;
        pillRef.current?.classList.toggle("nav-hidden", self.scroll() > 260 && self.direction === 1 && !openRef.current);
      },
    });
    return () => st.kill();
  }, []);

  const go = (id: string) => scrollToTarget(`#${id}`);
  // Referencia estable: el reloj re-renderiza el nav cada segundo
  const closeMenu = useCallback(() => setOpen(false), []);

  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
        <div
          ref={pillRef}
          className="pointer-events-auto relative mx-auto flex max-w-[1400px] items-center justify-between gap-3 rounded-full border border-white/10 bg-ink/60 py-2 pl-3 pr-2 backdrop-blur-xl transition-transform duration-700 ease-out-expo md:pl-4"
        >
          <button onClick={() => go("inicio")} className="group flex items-center gap-2.5" aria-label="SYKR4 — volver al inicio">
            <LogoMark className="h-8 w-8 text-bone transition-transform duration-700 ease-out-expo group-hover:rotate-180" />
            <span className="font-display text-[15px] font-semibold tracking-[-0.02em]">SYKR4</span>
          </button>

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <button key={l.id} onClick={() => go(l.id)} className="group relative rounded-full px-4 py-2 text-sm text-bone/70 transition-colors hover:text-bone">
                <RollText text={l.label} />
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 scale-0 rounded-full bg-cyan transition-transform duration-300 group-hover:scale-100" />
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 pr-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mute md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-volt/60" />
                <span className="relative h-2 w-2 rounded-full bg-volt" />
              </span>
              <span className="tabular-nums">España · {time}</span>
            </div>
            <button onClick={() => go("contacto")} className="group hidden items-center rounded-full bg-bone px-4 py-2.5 text-sm font-semibold text-ink sm:inline-flex">
              <RollText text="Hablemos" />
            </button>
            <button
              onClick={() => setOpen(true)}
              aria-expanded={open}
              aria-controls="menu"
              aria-label="Abrir menú"
              className="group grid h-10 w-10 place-items-center rounded-full border border-white/15 transition-colors hover:border-cyan/60"
            >
              <span className="flex w-4 flex-col items-end gap-[5px]">
                <span className="h-px w-full bg-bone" />
                <span className="h-px w-2/3 bg-bone transition-all duration-500 group-hover:w-full" />
              </span>
            </button>
          </div>

          <div
            ref={progRef}
            aria-hidden
            className="absolute inset-x-8 -bottom-px h-px origin-left bg-linear-to-r from-cyan via-violet to-volt"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
      </header>
      <MenuOverlay open={open} onClose={closeMenu} />
    </>
  );
}

function MenuOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);
  const [hover, setHover] = useState<number | null>(null);
  const [everOpened, setEverOpened] = useState(false);
  const { eco, setEco } = useQuality();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (firstRun.current) {
      firstRun.current = false;
      if (!open) return;
    }
    if (open) {
      const previousFocus = document.activeElement as HTMLElement | null;
      setEverOpened(true);
      lockScroll(true, "menu");
      gsap.fromTo(el, { clipPath: "circle(0% at 95% 5%)" }, { clipPath: "circle(150% at 95% 5%)", duration: 1.1, ease: "expo.inOut", overwrite: true });
      gsap.fromTo(el.querySelectorAll(".m-link"), { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.055, delay: 0.35 });
      gsap.fromTo(el.querySelectorAll(".m-fade"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06, delay: 0.55 });
      const id = window.setTimeout(() => el.querySelector<HTMLButtonElement>(".m-link-btn")?.focus({ preventScroll: true }), 450);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          lockScroll(false, "menu");
          onCloseRef.current();
        }
        if (e.key === "Tab") {
          const focusable = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')).filter(node => node.getClientRects().length);
          const first = focusable[0], last = focusable.at(-1);
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }
      };
      window.addEventListener("keydown", onKey);
      return () => {
        window.clearTimeout(id);
        window.removeEventListener("keydown", onKey);
        lockScroll(false, "menu");
        gsap.killTweensOf([el, ...el.querySelectorAll(".m-link, .m-fade")]);
        previousFocus?.focus({ preventScroll: true });
      };
    }
    gsap.to(el, { clipPath: "circle(0% at 95% 5%)", duration: 0.9, ease: "expo.inOut", overwrite: true });
  }, [open]);

  const close = () => {
    lockScroll(false, "menu");
    onClose();
  };
  const go = (id: string) => {
    lockScroll(false, "menu");
    onClose();
    scrollToTarget(`#${id}`);
  };
  const shown = hover ?? 0;

  return (
    <div
      id="menu"
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menú principal"
      inert={!open}
      className={cn("fixed inset-0 z-[80] flex flex-col bg-ink-2 px-5 pb-6 pt-4 md:px-10 md:pt-5", open ? "pointer-events-auto" : "pointer-events-none")}
      style={{ clipPath: "circle(0% at 95% 5%)" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background:radial-gradient(55%_45%_at_85%_15%,rgba(139,92,255,0.2),transparent_70%),radial-gradient(40%_40%_at_10%_90%,rgba(92,242,255,0.12),transparent_70%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[1400px] items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 text-bone" />
          <span className="font-display text-[15px] font-semibold">SYKR4</span>
        </div>
        <button onClick={close} aria-label="Cerrar menú" className="group flex items-center gap-3 rounded-full border border-white/15 py-1.5 pl-5 pr-1.5 text-sm transition-colors hover:border-cyan/60">
          <RollText text="Cerrar" />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 ease-out-expo group-hover:rotate-90">✕</span>
        </button>
      </div>

      <div data-lenis-prevent className="relative mx-auto mt-6 grid min-h-0 w-full max-w-[1400px] flex-1 gap-10 overflow-y-auto overscroll-contain lg:grid-cols-[1.35fr_1fr]">
        <ul className="flex flex-col justify-center" onMouseLeave={() => setHover(null)}>
          {NAV.map((item, i) => (
            <li key={item.id} className="overflow-hidden">
              <button
                onClick={() => go(item.id)}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                className={cn("m-link-btn group flex w-full py-1 text-left transition-opacity duration-300", hover !== null && hover !== i && "opacity-30")}
              >
                <span className="m-link inline-flex items-baseline gap-4 md:gap-6">
                  <span className="font-mono text-xs text-cyan">{String(i + 1).padStart(2, "0")}</span>
                  <span className="menu-link-title font-display font-medium leading-[1.08] tracking-[-0.03em]">
                    <RollText text={item.label} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <aside className="hidden flex-col justify-center gap-5 lg:flex">
          <div className="m-fade relative aspect-[4/3] overflow-hidden rounded-[28px] border border-white/10 bg-ink">
            {everOpened &&
              NAV.map((item, i) => item.id === "nosotros" ? (
                <div key={item.id} className={cn("absolute inset-0 flex flex-col justify-center bg-[radial-gradient(ellipse_at_20%_70%,rgba(92,242,255,0.13),transparent_65%)] p-10 transition-all duration-700 ease-out-expo", shown === i ? "scale-100 opacity-100" : "scale-110 opacity-0")}>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Equipo SYKR4</span>
                  <span className="mt-5 font-display text-4xl font-medium leading-tight tracking-[-0.03em]">Experiencia.<br />Visión conjunta.</span>
                  <span className="mt-5 max-w-xs text-sm leading-relaxed text-mute">Enrique y Javier al frente de arquitectura, seguridad y desarrollo.</span>
                </div>
              ) : (
                <img
                  key={item.id}
                  src={PREVIEW[item.id]}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out-expo",
                    shown === i ? "scale-100 opacity-100" : "scale-110 opacity-0",
                  )}
                />
              ))}
            <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-5 font-mono text-[11px] uppercase tracking-[0.2em] text-bone/80">
              {String(shown + 1).padStart(2, "0")} — {NAV[shown].label}
            </div>
          </div>

          <div className="m-fade rounded-[24px] border border-white/10 bg-ink/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Efectos visuales</p>
                <p className="mt-1 text-sm text-bone/80">{eco ? "Menos efectos para una navegación más ligera." : "Animaciones y efectos visuales completos."}</p>
              </div>
              <div role="radiogroup" aria-label="Calidad visual" className="flex shrink-0 rounded-full border border-white/15 p-1">
                <button
                  role="radio"
                  aria-checked={!eco}
                  onClick={() => setEco(false)}
                  className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition", !eco ? "bg-bone text-ink" : "text-mute hover:text-bone")}
                >
                  Completo
                </button>
                <button
                  role="radio"
                  aria-checked={eco}
                  onClick={() => setEco(true)}
                  className={cn("rounded-full px-4 py-1.5 text-xs font-medium transition", eco ? "bg-volt text-ink" : "text-mute hover:text-bone")}
                >
                  Ligero
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <div className="m-fade relative mx-auto mt-6 flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
        <span>© 2026 SYKR4 · Soluciones tecnológicas</span>
        <span>Automatización · Cloud · Seguridad · Desarrollo · Web</span>
      </div>
    </div>
  );
}

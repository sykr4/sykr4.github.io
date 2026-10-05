import { Fragment, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/scroll";
import { SectionLabel } from "@/components/ui";

type ChipKind = "stack" | "bolt" | "cloud";
const TOKENS: { t: string; cls?: string; chip?: ChipKind }[] = [
  { t: "Tu" }, { t: "web," }, { t: "tus" }, { t: "aplicaciones" }, { t: "y" },
  { t: "los" }, { t: "sistemas", cls: "text-gradient", chip: "stack" },
  { t: "que" }, { t: "las" }, { t: "hacen" }, { t: "funcionar" }, { t: "forman" },
  { t: "parte" }, { t: "del" }, { t: "mismo" }, { t: "negocio." },
  { t: "Los" }, { t: "conectamos", cls: "volt-underline", chip: "bolt" }, { t: "y" },
  { t: "mejoramos" }, { t: "para" }, { t: "que" }, { t: "tu" }, { t: "equipo" },
  { t: "tenga" }, { t: "la" }, { t: "información" }, { t: "que" }, { t: "necesita" },
  { t: "y" }, { t: "dedique" }, { t: "menos" }, { t: "tiempo" }, { t: "a" },
  { t: "tareas" }, { t: "repetitivas.", cls: "text-gradient", chip: "cloud" },
];

function Chip({ kind }: { kind: ChipKind }) {
  return (
    <span
      aria-hidden
      className="mw-chip mx-[0.12em] inline-flex h-[0.86em] translate-y-[0.06em] items-center gap-[0.08em] rounded-full border border-white/15 bg-white/[0.04] px-[0.3em] align-baseline"
    >
      {kind === "stack" &&
        [0, 1, 2].map((i) => <span key={i} className="animate-blink h-[0.42em] w-[0.11em] rounded-full bg-cyan" style={{ animationDelay: `${i * 0.2}s` }} />)}
      {kind === "bolt" && (
        <svg viewBox="0 0 24 24" className="h-[0.55em] w-[0.55em] text-volt">
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" />
        </svg>
      )}
      {kind === "cloud" && (
        <svg viewBox="0 0 24 24" className="h-[0.6em] w-[0.6em] text-cyan" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M7 18a4 4 0 0 1-.6-8A6 6 0 0 1 18 9a4 4 0 0 1 0 9Z" />
        </svg>
      )}
    </span>
  );
}

/**
 * MANIFIESTO — el texto se "enciende" palabra a palabra con el scroll (scrub).
 * Fondo: el campo de partículas se transforma en la "Red" (malla ondulada).
 */
export function Manifesto() {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ".mw",
        { opacity: 0.12 },
        { opacity: 1, ease: "none", stagger: 0.1, scrollTrigger: { trigger: ".mw-wrap", start: "top 78%", end: "bottom 48%", scrub: true } },
      );
      gsap.fromTo(
        ".mw-chip",
        { scale: 0.3, rotate: -25, opacity: 0 },
        { scale: 1, rotate: 0, opacity: 1, ease: "back.out(2)", stagger: 0.3, scrollTrigger: { trigger: ".mw-wrap", start: "top 70%", end: "bottom 50%", scrub: true } },
      );
    },
    { scope: ref },
  );

  return (
    <section id="manifiesto" ref={ref} data-gl-state="1" className="relative px-5 py-[22vh] md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel index="01" label="Nuestro enfoque" />
        <h2 className="mw-wrap mt-10 max-w-[1250px] font-display text-[clamp(1.65rem,4.1vw,4.1rem)] font-medium leading-[1.14] tracking-[-0.035em]">
          {TOKENS.map((tk, i) => (
            <Fragment key={i}>
              <span className={`mw inline-block ${tk.cls ?? ""}`}>{tk.t}</span>
              {tk.chip && <Chip kind={tk.chip} />}{" "}
            </Fragment>
          ))}
        </h2>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 font-mono text-[11px] uppercase tracking-[0.22em] text-mute">
          <span>Entendemos cómo trabajas</span>
          <span className="text-cyan">✦</span>
          <span>Aprovechamos lo que ya usas</span>
          <span className="text-cyan">✦</span>
          <span>Definimos una entrega concreta</span>
        </div>
      </div>
    </section>
  );
}

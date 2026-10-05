import { returnToTop, scrollToTarget } from "@/lib/scroll";
import { useLocalTime } from "@/lib/hooks";
import { SERVICES } from "@/data/content";
import { Magnetic } from "@/components/ui";
import { ArrowUpRight } from "@/components/icons";

export function Footer() {
  const time = useLocalTime();
  return (
    <footer className="relative z-10 overflow-hidden border-t border-white/10 bg-ink/80 px-5 pb-8 pt-20 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="max-w-xs font-display text-2xl font-medium leading-tight tracking-[-0.03em]">Del proceso que te frena a una solución que puedas usar.</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mute">Automatización, servicios en la nube, seguridad, desarrollo y web. Entendemos qué necesitas, aprovechamos las herramientas que ya tienes y acordamos contigo el siguiente paso.</p>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Servicios</p>
            <ul className="mt-4 space-y-2 text-sm text-bone/80">
              {SERVICES.map((s) => (
                <li key={s.title}>
                  <button onClick={() => scrollToTarget("#servicios")} className="transition-colors hover:text-cyan">
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Empresa</p>
            <ul className="mt-4 space-y-2 text-sm text-bone/80">
              {[
                ["Ejemplos", "#casos"],
                ["Método", "#resultados"],
                ["Nosotros", "#nosotros"],
                ["Contacto", "#contacto"],
              ].map(([l, h]) => (
                <li key={h}>
                  <button onClick={() => scrollToTarget(h)} className="transition-colors hover:text-cyan">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute">Antes de empezar</p>
            <ul className="mt-4 space-y-2 text-sm text-bone/80">
              <li>Sabes qué incluye</li>
              <li>Precio y plazo acordados</li>
              <li>Entrega y revisión contigo</li>
            </ul>
          </div>
        </div>

        {/* Wordmark gigante: cada letra reacciona al hover */}
        <div aria-hidden className="mt-20 flex select-none justify-between font-display text-[clamp(5rem,23vw,22rem)] font-bold leading-[0.8] tracking-[-0.06em]">
          {"SYKR4".split("").map((ch, i) => (
            <span key={i} className="text-outline inline-block transition-[transform,-webkit-text-stroke-color] duration-700 ease-out-expo hover:-translate-y-[8%] hover:[-webkit-text-stroke-color:#5cf2ff]">
              {ch}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-mute">
          <span>© 2026 SYKR4 · Soluciones tecnológicas</span>
          <span className="tabular-nums">Hora local · España {time}</span>
          <span className="hidden md:inline">Varias especialidades · Trato directo con el equipo</span>
          <Magnetic>
            <button onClick={returnToTop} className="group flex items-center gap-2 rounded-full border border-white/15 py-2 pl-4 pr-2 text-bone transition-colors hover:border-cyan/60">
              Volver arriba
              <span className="grid h-7 w-7 place-items-center rounded-full bg-bone text-ink transition-transform duration-500 group-hover:-rotate-45">
                <ArrowUpRight className="h-3.5 w-3.5 -rotate-45" />
              </span>
            </button>
          </Magnetic>
        </div>
      </div>
    </footer>
  );
}

import { useEffect, useState } from "react";
import { ScrollTrigger, scrollToTarget } from "@/lib/scroll";
import { NAV } from "@/data/content";
import { cn } from "@/utils/cn";

/** Navegación flotante lateral (desktop): sección activa + etiquetas en hover */
export function SectionIndicator() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const triggers = NAV.map((item, i) => {
      const el = document.getElementById(item.id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => self.isActive && setActive(i),
      });
    });
    return () => triggers.forEach((t) => t?.kill());
  }, []);

  return (
    <nav aria-label="Secciones" className="section-indicator fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:block">
      <ul className="flex flex-col gap-2.5">
        {NAV.map((item, i) => (
          <li key={item.id}>
            <button
              onClick={() => scrollToTarget(`#${item.id}`)}
              aria-current={active === i ? "true" : undefined}
              aria-label={`Ir a ${item.label}`}
              className="group flex items-center justify-end gap-3 py-0.5"
            >
              <span className="translate-x-2 font-mono text-[10px] uppercase tracking-[0.2em] text-bone opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                {item.label}
              </span>
              <span className={cn("h-px transition-all duration-500 ease-out-expo", active === i ? "w-10 bg-cyan" : "w-4 bg-white/25 group-hover:w-7")} />
              <span className={cn("w-5 font-mono text-[10px] tabular-nums transition-colors", active === i ? "text-bone" : "text-mute")}>
                {String(i + 1).padStart(2, "0")}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

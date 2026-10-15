import { useEffect, useState } from "react";
import { ScrollTrigger, scrollToTarget } from "@/lib/scroll";
import { NAV } from "@/data/content";
import { BUSINESS_CONTACT } from "@/data/team";
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
    <>
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
    <a
      href={BUSINESS_CONTACT.whatsappHref}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar con el equipo SYKR4 por WhatsApp, abre en una pestaña nueva"
      className="section-indicator floating-whatsapp fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-40 grid h-12 w-12 place-items-center rounded-full bg-[#25d366] text-white shadow-lg transition-colors hover:bg-[#1da851] md:h-14 md:w-14 [@media(max-height:480px)]:bottom-[max(0.75rem,env(safe-area-inset-bottom))] [@media(max-height:480px)]:h-11 [@media(max-height:480px)]:w-11"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7 md:h-8 md:w-8">
        <path d="M20.5 11.7a8.6 8.6 0 0 1-12.8 7.5L3 20.5l1.3-4.6a8.6 8.6 0 1 1 16.2-4.2Z" strokeLinejoin="round" />
        <path d="m8 7 2 3-1 1c.8 1.7 2 2.9 3.7 3.7l1-1 3 2c-.7 2-2.2 2-3.7 1.5-3.2-1.1-5.2-3.2-6.3-6.3C6.2 9.3 6.3 7.8 8 7Z" strokeLinejoin="round" />
      </svg>
    </a>
    </>
  );
}

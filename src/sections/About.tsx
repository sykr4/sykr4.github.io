import { useState } from "react";
import { PILLARS } from "@/data/content";
import { RevealWords, SectionLabel } from "@/components/ui";
import { TeamProfiles } from "@/components/TeamProfiles";

/** La presentación del equipo se concentra en la sección Nosotros existente. */
export function About() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="nosotros" data-gl-state="4" className="relative px-5 py-32 md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="team-about-intro">
          <div>
            <SectionLabel index="05" label="Nosotros" />
            <RevealWords as="h2" text="Experiencia al frente de tu proyecto." highlight={["proyecto."]} className="mt-8 font-display text-[clamp(2.1rem,4.2vw,4rem)] font-semibold leading-[1.03] tracking-[-0.04em]" />
            <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-mute">
              En SYKR4 unimos experiencia en sistemas, servicios en la nube, seguridad y desarrollo. Nuestro equipo trabaja de forma coordinada para entender cómo funciona tu empresa y crear soluciones que encajen en tu día a día.
            </p>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mute">
              Enrique y Javier dirigen las áreas técnicas y coordinan al equipo. Te ayudan a decidir qué hacer primero y te acompañan desde la primera conversación hasta la puesta en marcha.
            </p>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-mute">
              Carlos conecta las necesidades de cada cliente con el equipo técnico y se ocupa de las reuniones y la comunicación de SYKR4.
            </p>
          </div>
          <div className="team-pillars">
            {PILLARS.map((pillar, index) => (
              <div className="team-pillar" key={pillar.title}>
                <h3>
                  <button type="button" id={`team-pillar-trigger-${index}`} aria-expanded={open === index} aria-controls={`team-pillar-panel-${index}`} onClick={() => setOpen(open === index ? null : index)}>
                    <span>{pillar.title}</span><span className={open === index ? "team-pillar-plus is-open" : "team-pillar-plus"} aria-hidden="true">+</span>
                  </button>
                </h3>
                <div id={`team-pillar-panel-${index}`} role="region" aria-labelledby={`team-pillar-trigger-${index}`} hidden={open !== index}>
                  <p>{pillar.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <TeamProfiles />
      </div>
    </section>
  );
}

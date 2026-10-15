import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import { gsap, lockScroll } from "@/lib/scroll";
import { ArrowUpRight } from "@/components/icons";
import { BUSINESS_CONTACT, TEAM, TEAM_SOCIAL, type TeamMember } from "@/data/team";
import "./team.css";

function PhoneIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m8 3 3 5-2 2c1.1 2.4 2.6 3.9 5 5l2-2 5 3-1 4c-.2.8-1 1.2-1.8 1-8-1.4-13.8-7.2-15.2-15.2C2.8 5 3.2 4.2 4 4l4-1Z" strokeLinejoin="round" /></svg>;
}

function WhatsAppIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.5 11.7a8.6 8.6 0 0 1-12.8 7.5L3 20.5l1.3-4.6a8.6 8.6 0 1 1 16.2-4.2Z" strokeLinejoin="round" /><path d="m8 7 2 3-1 1c.8 1.7 2 2.9 3.7 3.7l1-1 3 2c-.7 2-2.2 2-3.7 1.5-3.2-1.1-5.2-3.2-6.3-6.3C6.2 9.3 6.3 7.8 8 7Z" strokeLinejoin="round" /></svg>;
}

export function TeamContactLinks() {
  return <div className="team-contact-actions">
    <a href={BUSINESS_CONTACT.href} className="team-phone-link" aria-label={`Llamar al equipo SYKR4 al ${BUSINESS_CONTACT.phone}`}><PhoneIcon /><span><span className="team-call-caption">Llama a SYKR4</span>{BUSINESS_CONTACT.phone}</span></a>
    <a href={BUSINESS_CONTACT.whatsappHref} className="team-whatsapp-link" target="_blank" rel="noopener noreferrer" aria-label="Contactar con el equipo SYKR4 por WhatsApp, abre en una pestaña nueva"><WhatsAppIcon /><span>WhatsApp</span><ArrowUpRight /></a>
  </div>;
}

function InstagramIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" stroke="none" /></svg>;
}

function Portrait({ member, large = false }: { member: TeamMember; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`team-portrait${large ? " team-portrait--large" : ""}`}>
      {failed ? <span role="img" aria-label={`Retrato de ${member.name} no disponible`} className="team-portrait-fallback">{member.initials}</span> : (
        <img src={member.image} alt={`Retrato de ${member.name}`} width={720} height={member.id === "carlos" ? 960 : 720} loading="lazy" decoding="async" style={{ objectPosition: member.imagePosition }} onError={() => setFailed(true)} />
      )}
    </div>
  );
}

export function TeamProfileDialog({ member, onDismiss, returnFocusTo }: { member: TeamMember; onDismiss: () => void; returnFocusTo?: HTMLElement | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const opener = returnFocusTo ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    dialog.showModal();
    lockScroll(true, "team-profile");
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(dialog.querySelector(".team-dialog-panel"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
      gsap.fromTo(dialog.querySelectorAll("[data-profile-reveal]"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.055, delay: 0.08, ease: "power3.out" });
    });
    return () => {
      motion.revert();
      dialog.close();
      lockScroll(false, "team-profile");
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [returnFocusTo]);
  return createPortal(
    <dialog ref={dialogRef} id="team-profile-dialog" className="team-dialog" aria-labelledby="team-profile-name" aria-describedby="team-profile-area" data-lenis-prevent
      onCancel={(event) => { event.preventDefault(); onDismiss(); }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget; }}
      onClick={(event) => { if (backdropPress.current && event.target === event.currentTarget) onDismiss(); backdropPress.current = false; }}>
      <div className="team-dialog-panel">
        <button type="button" autoFocus className="team-dialog-close" onClick={onDismiss} aria-label={`Cerrar perfil de ${member.firstName}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        <div className="team-dialog-scroll" data-lenis-prevent>
          <div className="team-dialog-identity">
            <Portrait member={member} large />
            <div>
              <p className="team-eyebrow" data-profile-reveal>Equipo SYKR4</p>
              <h2 id="team-profile-name" data-profile-reveal>{member.name}</h2>
              <p id="team-profile-area" className="team-dialog-area" data-profile-reveal>{member.area}</p>
              {member.experience ? <p className="team-experience" data-profile-reveal>{member.experience}</p> : null}
            </div>
          </div>
          <div className="team-dialog-copy">
            {member.bio.map((paragraph) => <p key={paragraph} data-profile-reveal>{paragraph}</p>)}
            <h3 data-profile-reveal>En qué te ayuda</h3>
            <ul data-profile-reveal>{member.responsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div className="team-dialog-contact" data-profile-reveal>
            <div><p className="team-eyebrow">Contacta con el equipo</p><p>Cuéntanos tu proyecto por teléfono o WhatsApp. Coordinamos el siguiente paso contigo.</p></div>
            <TeamContactLinks />
          </div>
          {member.id === "carlos" ? <a className="team-social-link team-dialog-social" href={TEAM_SOCIAL.href} target="_blank" rel="noopener noreferrer" aria-label="Instagram de SYKR4, abre en una pestaña nueva"><InstagramIcon /><span>SYKR4 en Instagram</span><ArrowUpRight /></a> : null}
        </div>
      </div>
    </dialog>, document.body,
  );
}

export function TeamProfiles() {
  const ref = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  useGSAP(() => {
    const motion = gsap.matchMedia();
    motion.add("(prefers-reduced-motion: no-preference)", () => {
      // No pinning, scroll capture, scrub or perpetual animation in the new content.
      gsap.fromTo(".team-card", { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 88%", once: true } });
      gsap.fromTo(".team-card .team-portrait", { scale: 0.94 }, { scale: 1, duration: 1.05, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: ref.current, start: "top 88%", once: true } });
      gsap.fromTo(".team-contact-strip", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: ".team-contact-strip", start: "top 94%", once: true } });
    }, ref);
    return () => motion.revert();
  }, { scope: ref });
  return (
    <div ref={ref} className="team-profiles">
      <div className="team-collection-label"><span>Las personas detrás de SYKR4</span><span>03 perfiles · Un mismo equipo</span></div>
      <div className="team-grid">
        {TEAM.map((member, index) => (
          <article className="team-card" key={member.id} aria-labelledby={`team-${member.id}`} data-member={member.id}>
            <div className="team-card-topline"><span aria-hidden="true">0{index + 1}</span></div>
            <Portrait member={member} />
            <div className="team-card-body">
              <h3 id={`team-${member.id}`}>{member.name}</h3>
              <p className="team-card-area">{member.area}</p>
              <p className="team-card-summary">{member.summary}</p>
              <ul className="team-specialties" aria-label={`Especialidades de ${member.firstName}`}>{member.specialties.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <button type="button" className="team-profile-button" onClick={(event) => { openerRef.current = event.currentTarget; setSelected(member); }} aria-haspopup="dialog"><span>Conoce a {member.firstName}</span><ArrowUpRight /></button>
          </article>
        ))}
      </div>
      <div className="team-contact-strip">
        <div className="team-contact-intro"><span className="team-contact-dot" aria-hidden="true" /><div><p className="team-eyebrow">Contacta con el equipo SYKR4</p><p>Cuéntanos tu idea. Coordinamos el siguiente paso contigo.</p></div></div>
        <TeamContactLinks />
        <a href={TEAM_SOCIAL.href} className="team-social-link" target="_blank" rel="noopener noreferrer" aria-label="Instagram de SYKR4, abre en una pestaña nueva"><InstagramIcon /><span>{TEAM_SOCIAL.handle}</span><ArrowUpRight /></a>
      </div>
      {selected ? <TeamProfileDialog key={selected.id} member={selected} returnFocusTo={openerRef.current} onDismiss={() => setSelected(null)} /> : null}
    </div>
  );
}

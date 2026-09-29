import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { isReturningToTop, navigateDirectlyToTop } from "./topNavigation";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Smooth scroll con Lenis sincronizado con ScrollTrigger y con el MISMO
 * ticker de GSAP (patrón recomendado: un único rAF para todo).
 */
let lenis: Lenis | null = null;
const scrollLocks = new Set<string>();
let pendingTarget: { target: string | number | HTMLElement; offset: number } | null = null;

function continueNavigation() {
  const intent = pendingTarget;
  if (!intent || scrollLocks.size) return;
  const element = typeof intent.target === "string" ? document.querySelector<HTMLElement>(intent.target) : typeof intent.target === "number" ? null : intent.target;
  const top = typeof intent.target === "number" ? intent.target : element ? element.getBoundingClientRect().top + window.scrollY : null;
  if (top === null) { pendingTarget = null; return; }
  if (lenis) {
    lenis.scrollTo(top, { offset: intent.offset, duration: 1.6, onComplete: () => { if (pendingTarget === intent) pendingTarget = null; } });
  } else {
    pendingTarget = null;
    window.scrollTo({ top: top + intent.offset, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
}

export function initSmoothScroll(enabled: boolean) {
  const cancel = () => { pendingTarget = null; };
  const onKey = (event: KeyboardEvent) => { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Escape"].includes(event.key)) cancel(); };
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("keydown", onKey);
  const cleanupNavigation = () => {
    cancel();
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("keydown", onKey);
  };
  if (!enabled) return cleanupNavigation;

  const instance = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    touchMultiplier: 1.3,
  });
  lenis = instance;
  if (scrollLocks.size) instance.stop();

  instance.on("scroll", ScrollTrigger.update);
  const raf = (time: number) => instance.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);

  return () => {
    cleanupNavigation();
    gsap.ticker.remove(raf);
    instance.destroy();
    if (lenis === instance) lenis = null;
  };
}

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  pendingTarget = { target, offset };
  continueNavigation();
}

/** Salto inmediato, usado por escenas que capturan temporalmente el scroll. */
export function jumpScrollTo(y: number) {
  const top = Math.max(0, y);
  if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
  window.scrollTo(0, top);
  ScrollTrigger.update();
}

/** Only this explicit action bypasses the video; manual navigation still captures it. */
export function returnToTop() {
  pendingTarget = null;
  navigateDirectlyToTop(() => jumpScrollTo(0));
}

/** Bloquea/desbloquea el scroll (preloader y menú). */
export function lockScroll(value: boolean, owner = "ui") {
  if (value) scrollLocks.add(owner);
  else scrollLocks.delete(owner);
  const locked = scrollLocks.size > 0;
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (!locked && owner === "video-story" && !isReturningToTop()) continueNavigation();
}

export { gsap, ScrollTrigger };

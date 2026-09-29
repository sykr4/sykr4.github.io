import { jumpScrollTo, ScrollTrigger } from "./scroll";

const key = `sykr4:scroll:${location.pathname}`;

/** Save section-relative position so font/layout changes do not restore into another scene. */
export function rememberScroll() {
  const save = () => {
    const sections = [...document.querySelectorAll<HTMLElement>("main > section[id]")];
    const section = sections.find(el => { const r = el.getBoundingClientRect(); return r.top <= 1 && r.bottom > 0; });
    try { sessionStorage.setItem(key, JSON.stringify({ id: section?.id, offset: section ? -section.getBoundingClientRect().top : 0, y: window.scrollY })); } catch { /* Storage can be disabled. */ }
  };
  window.addEventListener("pagehide", save);
  return () => window.removeEventListener("pagehide", save);
}

export function restoreScroll() {
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (!navigation || !["reload", "back_forward"].includes(navigation.type)) return;
  try {
    const position = JSON.parse(sessionStorage.getItem(key) || "null");
    if (!position || !Number.isFinite(position.y)) return;
    ScrollTrigger.refresh();
    const section = typeof position.id === "string" ? document.getElementById(position.id) : null;
    const y = section ? section.getBoundingClientRect().top + window.scrollY + Math.max(0, Math.min(Number(position.offset) || 0, section.offsetHeight - 1)) : position.y;
    jumpScrollTo(y);
  } catch { /* Malformed/disabled storage must never block navigation. */ }
}

import { useEffect, useMemo, useState } from "react";
import { getDeviceProfile } from "@/lib/device";
import { initSmoothScroll, ScrollTrigger } from "@/lib/scroll";
import { rememberScroll, restoreScroll } from "@/lib/scrollRestoration";
import { useMediaQuery } from "@/lib/hooks";
import { QualityContext } from "@/lib/quality";
import { Preloader } from "@/components/Preloader";
import { ParticleBackground, StaticBackdrop } from "@/components/ParticleBackground";
import { TrailCanvas } from "@/components/TrailCanvas";
import { Cursor } from "@/components/Cursor";
import { Nav } from "@/components/Nav";
import { SectionIndicator } from "@/components/SectionIndicator";
import { Hero } from "@/sections/Hero";
import { Manifesto } from "@/sections/Manifesto";
import { Services } from "@/sections/Services";
import { VideoStory } from "@/sections/VideoStory";
import { Cases } from "@/sections/Cases";
import { Results } from "@/sections/Results";
import { About } from "@/sections/About";
import { Contact } from "@/sections/Contact";
import { Footer } from "@/sections/Footer";

/**
 * SYKR4 — experiencia inmersiva.
 * Capas (de atrás hacia delante):
 *  z-0   canvas WebGL persistente (partículas que cambian de forma por sección)
 *  z-10  contenido HTML (SEO + accesibilidad: todo el texto es DOM real)
 *  z-40  indicador de secciones · z-50 nav flotante
 *  z-60  rastro de luz (mix-blend: screen) · z-80 menú · z-100 cursor · z-200 preloader
 */
export default function App() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const device = useMemo(() => ({ ...getDeviceProfile(), reducedMotion }), [reducedMotion]);
  const [eco, setEco] = useState(() => device.tier === "low");
  const [ready, setReady] = useState(false);

  useEffect(() => initSmoothScroll(!reducedMotion), [reducedMotion]);
  useEffect(rememberScroll, []);

  // Recalcular posiciones de ScrollTrigger cuando cambian las métricas del layout
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(() => { ScrollTrigger.refresh(); restoreScroll(); });
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  const ctx = useMemo(() => ({ device, eco, setEco, ready }), [device, eco, ready]);
  const showTrail = device.webgl2 && !device.touch && !device.reducedMotion && !eco;
  const showCursor = !device.touch && !device.reducedMotion;

  return (
    <QualityContext.Provider value={ctx}>
      <a
        href="#manifiesto"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[300] focus:rounded-full focus:bg-volt focus:px-4 focus:py-2 focus:text-ink"
      >
        Saltar al contenido
      </a>
      <Preloader onDone={() => setReady(true)} />
      {device.webgl2 ? <ParticleBackground /> : <StaticBackdrop />}
      {showTrail && <TrailCanvas />}
      {showCursor && <Cursor />}
      {device.tier === "high" && !eco && <div aria-hidden className="grain" />}
      <Nav />
      <SectionIndicator />
      <main className="relative z-10">
        <Hero />
        <Manifesto />
        <Services />
        <Cases />
        <Results />
        <About />
        <VideoStory />
        <Contact />
      </main>
      <Footer />
    </QualityContext.Provider>
  );
}

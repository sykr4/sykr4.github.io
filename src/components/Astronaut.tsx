import { useEffect, useRef, useState } from "react";
import "./astronaut.css";

export type AstronautCue = { gesture: "wave" | "wrist"; sequence: number } | null;

interface AstronautDiagnostics {
  loaded: boolean;
  rendered: boolean;
  reducedMotion: boolean;
  paused: boolean;
  failed: boolean;
  clipNames: string[];
  [key: string]: unknown;
}

interface AstronautController {
  playWave: () => boolean;
  playWristCheck: () => boolean;
  playMilitarySalute: () => boolean;
  setPaused: (value: boolean) => void;
  getDiagnostics: () => AstronautDiagnostics;
  dispose: () => void;
}

type AstronautHost = HTMLDivElement & { sykr4Astronaut?: AstronautController };

function astronautAsset(filename: string) {
  // Honors Vite's configured base, including the supplied single-file build's relative base.
  const base = new URL(import.meta.env.BASE_URL, document.baseURI);
  return new URL(`astronaut/${filename}`, base).href;
}

/** Original V4 model and behavior, loaded only as the contact section approaches. */
export function Astronaut({ cue }: { cue: AstronautCue }) {
  const hostRef = useRef<AstronautHost>(null);
  const controllerRef = useRef<AstronautController | null>(null);
  const [state, setState] = useState<"waiting" | "loading" | "ready" | "fallback">("waiting");
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [hasRuntime, setHasRuntime] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let started = false;
    setState("waiting");
    setPaused(false);
    setHasRuntime(false);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setReducedMotion(media.matches);
    syncMotion();
    media.addEventListener("change", syncMotion);

    const start = async () => {
      if (disposed || started) return;
      started = true;
      setState("loading");
      try {
        // Public module retains the supplied runtime, decoder and materials without CDN requests.
        const runtimeUrl = astronautAsset("runtime.mjs");
        const runtime = await import(/* @vite-ignore */ runtimeUrl);
        if (disposed) return;
        const scope = host.closest("section") ?? host;
        const controller: AstronautController = runtime.createAstronaut(host, {
          ...runtime.astronautConfig,
          modelUrl: astronautAsset("sykr4-astronaut-v4.glb"),
          fallbackUrl: astronautAsset("sykr4-astronaut-preview.png"),
          quietScope: scope,
          pointerScope: scope,
          maxDpr: Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.25 : 1.5),
          loadMargin: "500px",
          onReady: (diagnostics: AstronautDiagnostics) => {
            if (disposed) return;
            setState(diagnostics.failed ? "fallback" : "ready");
            setReducedMotion(diagnostics.reducedMotion);
          },
          onError: () => { if (!disposed) setState("fallback"); },
        });
        controllerRef.current = controller;
        setHasRuntime(true);
        // Small, local diagnostic hook for browser QA; removed with the component.
        host.sykr4Astronaut = controller;
      } catch {
        if (!disposed) setState("fallback");
      }
    };

    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer?.disconnect();
        void start();
      }
    }, { rootMargin: "500px" });
    if (observer) observer.observe(host);
    else void start();

    return () => {
      disposed = true;
      observer?.disconnect();
      media.removeEventListener("change", syncMotion);
      controllerRef.current?.dispose();
      controllerRef.current = null;
      delete host.sykr4Astronaut;
    };
  }, [attempt]);

  useEffect(() => {
    if (!cue) return;
    const controller = controllerRef.current;
    // The original controller declines gestures while typing, paused or already in a gesture.
    if (cue.gesture === "wave") controller?.playWave();
    else controller?.playWristCheck();
  }, [cue]);

  return (
    <div className="astronaut-card" data-astronaut-state={state}>
      <div className="astronaut-card__signal" aria-hidden="true">
        <span className="astronaut-card__dot" /> EXPLORADOR SYKR4
      </div>
      <div className="astronaut-card__viewport">
        <div ref={hostRef} data-astronaut-host className="astronaut-card__host" />
        {!hasRuntime && (
          <img
            className="astronaut-card__placeholder"
            src={astronautAsset("sykr4-astronaut-preview.png")}
            alt="El astronauta de SYKR4, preparado para la siguiente misión"
            loading="lazy"
            decoding="async"
          />
        )}
      </div>
      <div className="astronaut-card__caption">
        <p role="status" aria-live="polite">
          {state === "fallback" ? "Tu próxima misión empieza aquí." : reducedMotion ? "Tu explorador, sin animaciones." : "El explorador se mueve solo. Puedes girarlo y probar sus gestos."}
        </p>
        {state === "ready" && !reducedMotion && (
          <button
            type="button"
            aria-pressed={paused}
            onClick={() => {
              controllerRef.current?.setPaused(!paused);
              setPaused(!paused);
            }}
            className="astronaut-card__pause"
          >
            {paused ? "Reanudar animación" : "Pausar animación"}
          </button>
        )}
        {state === "fallback" && (
          <button type="button" className="astronaut-card__pause" onClick={() => setAttempt((value) => value + 1)}>
            Reintentar vista 3D
          </button>
        )}
      </div>
    </div>
  );
}

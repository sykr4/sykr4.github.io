import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, jumpScrollTo, lockScroll } from "@/lib/scroll";
import { addFrame } from "@/lib/loop";
import { videoEntry, rearmVideo, type VideoPhase } from "@/lib/videoGate";
import { isReturningToTop, TOP_NAVIGATION } from "@/lib/topNavigation";
import { useInView } from "@/lib/hooks";
import { useQuality } from "@/lib/quality";
import { CHAPTERS, MEDIA } from "@/data/content";
import { SectionLabel } from "@/components/ui";

const FALLBACK_DURATION = 76.1667;
const FRAME_RATE = 24;
const MAX_RATE = 10;
const MAX_BOOST = MAX_RATE - 1;
const MIN_NATIVE_RATE = 0.14;
const TRAP_BUFFER_PX = 32;
const INPUT_DECAY = 2.8;
const INPUT_GRACE_MS = 90;
const INPUT_DEADZONE = 0.75;
const WHEEL_CURVE = 0.012;
const ZERO_CROSS_RATE = 0.14;
const CROSS_DAMPING = 9.5;


function fmt(t: number) {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${(s - m * 60).toFixed(2).padStart(5, "0")}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * RECORRIDO — autoplay con captura real de scroll.
 *
 * Reglas de la escena:
 * 1. Entrar desde arriba captura la página y SIEMPRE arranca a 1×. El gesto
 *    que produjo la entrada se descarta por completo; solo el siguiente gesto
 *    del usuario puede acelerar el vídeo.
 * 2. Mientras el vídeo no haya terminado, el scroll de página queda bloqueado.
 *    Scroll abajo = impulso de velocidad; al soltar, vuelve suavemente a 1×.
 * 3. Scroll arriba cambia la intención: el vídeo frena, cruza 0 y rebobina.
 *    Una vez invertido, continúa solo hacia 00:00 aunque se deje de hacer scroll.
 * 4. Solo al llegar exactamente al final se libera la salida hacia abajo; solo
 *    al llegar exactamente a 00:00 se libera la salida hacia arriba.
 * 5. Cada nueva entrada reproduce otra vez el recorrido. Alcanzar un extremo
 *    libera solo esa salida; volver en sentido contrario reactiva la escena.
 *
 * El vídeo y los capítulos se sincronizan por tiempo real, no por scrollY.
 */
export function VideoStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const { device } = useQuality();
  const near = useInView(sectionRef, "150% 0px", true);
  const [failed, setFailed] = useState(false);
  const [requestedPlayback, setRequestedPlayback] = useState(false);
  const useVideo = !failed && (requestedPlayback || (!device.reducedMotion && !device.saveData));
  const statusRef = useRef<HTMLParagraphElement>(null);
  const closingRef = useRef<HTMLDivElement>(null);
  const manualStartRef = useRef(false);

  const s = useRef({
    duration: FALLBACK_DURATION,
    ready: false,
    phase: "idle" as VideoPhase,
    direction: 0 as -1 | 0 | 1,
    signedRate: 0,
    virtualTime: 0,
    chapter: -1,
    manualClock: false,
    playPending: false,
    nativePlayFailed: false,
    boost: 0,
    inputReadyAt: 0,
    lastInputAt: 0,
    touchY: null as number | null,
    trapped: false,
    trapStarted: false,
    trapY: 0,
    entryDirection: 1 as 1 | -1,
    progressAt: 0,
    lastMediaTime: 0,
    lastObservedY: typeof window !== "undefined" ? window.scrollY : 0,
  });

  const getBounds = () => {
    const el = sectionRef.current;
    if (!el) return null;
    const top = el.getBoundingClientRect().top + window.scrollY;
    return { top, end: top + Math.max(0, el.offsetHeight - window.innerHeight) };
  };

  const resetVisual = () => {
    const startClip = "inset(3% 3% 3% 3% round 22px)";
    gsap.killTweensOf([frameRef.current, ".vs-media", ".vs-hud"]);
    gsap.set(frameRef.current, { clipPath: startClip });
    gsap.set(".vs-media", { scale: 1 });
    gsap.set(".vs-hud", { autoAlpha: 0 });
  };

  const openVisual = () => {
    const startClip = "inset(3% 3% 3% 3% round 22px)";
    gsap.killTweensOf([frameRef.current, ".vs-media", ".vs-hud"]);
    gsap
      .timeline()
      .fromTo(frameRef.current, { clipPath: startClip }, { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: device.reducedMotion ? 0 : 0.9, ease: "expo.inOut" }, 0)
      .to(".vs-hud", { autoAlpha: 1, duration: 0.45, ease: "power2.out" }, 0.58);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!near || !useVideo || !v) return;

    const onMeta = () => {
      const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : FALLBACK_DURATION;
      const st = s.current;
      st.duration = duration;
      st.ready = true;
      st.virtualTime = v.currentTime;
    };
    const onError = () => setFailed(true);
    const onSeeked = () => {
      if (!s.current.manualClock) s.current.virtualTime = v.currentTime;
    };

    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("error", onError);
    v.addEventListener("seeked", onSeeked);
    if (!v.getAttribute("src")) {
      v.src = MEDIA.video;
      v.load();
    } else if (v.readyState >= 1) {
      onMeta();
    }

    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("error", onError);
      v.removeEventListener("seeked", onSeeked);
    };
  }, [near, useVideo]);

  useGSAP(
    () => {
      if (!useVideo || device.reducedMotion) {
        gsap.set(frameRef.current, { clipPath: "inset(0% 0% 0% 0% round 0px)" });
        gsap.set(".vs-hud", { autoAlpha: 0 });
      } else {
        resetVisual();
      }
      gsap.set(".vs-chapter", { autoAlpha: 0, y: 46 });
    },
    { scope: sectionRef, dependencies: [device.reducedMotion, useVideo], revertOnUpdate: true },
  );

  useEffect(() => {
    if (!useVideo) return;
    const v = videoRef.current;
    if (!v) return;

    const items = listRef.current ? (Array.from(listRef.current.children) as HTMLElement[]) : [];
    let disposed = false;

    const setChapter = (next: number, reverse: boolean) => {
      const st = s.current;
      if (next === st.chapter) return;
      const prev = st.chapter;
      st.chapter = next;

      if (prev >= 0) {
        const oldEl = sectionRef.current?.querySelector<HTMLElement>(`.vs-ch-${prev}`);
        if (oldEl) {
          gsap.killTweensOf(oldEl);
          gsap.to(oldEl, { autoAlpha: 0, y: reverse ? 44 : -44, duration: 0.3, ease: "power2.in" });
        }
      }
      if (next >= 0) {
        const newEl = sectionRef.current?.querySelector<HTMLElement>(`.vs-ch-${next}`);
        if (newEl) {
          gsap.killTweensOf(newEl);
          gsap.fromTo(newEl, { autoAlpha: 0, y: reverse ? -52 : 52 }, { autoAlpha: 1, y: 0, duration: 0.56, ease: "expo.out" });
        }
      }
      items.forEach((li, i) => (li.dataset.active = String(i === next)));
    };

    const ensureForwardPlayback = (rate: number) => {
      const st = s.current;
      // HTMLVideoElement.play() sobre un elemento que ya está en `ended` puede
      // volver a arrancarlo desde 0. Bloqueamos explícitamente ese caso: el
      // extremo final solo puede liberar hacia abajo o iniciar un rebobinado.
      if (v.ended || v.currentTime >= st.duration - 0.055) {
        v.pause();
        st.virtualTime = Math.min(st.duration, v.currentTime);
        return;
      }
      if (Math.abs(v.playbackRate - rate) > 0.025) v.playbackRate = rate;
      if (!v.paused || st.playPending || st.nativePlayFailed) return;
      st.playPending = true;
      v.play()
        .then(() => {
          if (disposed) return;
          st.playPending = false;
          st.nativePlayFailed = false;
        })
        .catch(() => {
          if (disposed) return;
          st.playPending = false;
          st.nativePlayFailed = true;
        });
    };

    const startTrapPlayback = () => {
      const st = s.current;
      if (!st.trapped || !st.ready || st.trapStarted) return;
      const direction = st.direction || 1;

      // Toda entrada nueva parte del extremo correspondiente, también después
      // de completar un recorrido o un rebobinado.
      const startTime = direction > 0 ? 0 : Math.max(0, st.duration - 1 / FRAME_RATE);
      v.currentTime = startTime;
      st.virtualTime = startTime;
      st.lastMediaTime = startTime;
      st.progressAt = performance.now();

      st.trapStarted = true;
      st.boost = 0;
      st.inputReadyAt = performance.now() + INPUT_GRACE_MS;
      st.lastInputAt = performance.now();
      st.manualClock = direction < 0;
      st.virtualTime = v.currentTime;
      st.nativePlayFailed = false;
      st.playPending = false;
      st.signedRate = direction > 0 ? 1 : -1;

      // La entrada siempre empieza a 1×/−1×. Cualquier impulso del gesto que
      // cruzó la puerta se desecha; solo los eventos posteriores modifican rate.
      if (direction > 0) {
        v.playbackRate = 1;
        ensureForwardPlayback(1);
      } else {
        v.pause();
      }
    };

    const engage = (direction: 1 | -1) => {
      const st = s.current;
      if (st.trapped) return;
      const bounds = getBounds();
      if (!bounds) return;

      // IMPORTANTE: marcamos/paramos ANTES de recolocar la página. De este modo
      // el scroll sintético generado por jumpScrollTo no puede reentrar en la
      // puerta ni competir con Lenis. Incluso si el vídeo aún no ha cargado, la
      // página queda retenida aquí hasta que loadedmetadata permita arrancarlo.
      st.trapped = true;
      st.trapStarted = false;
      st.phase = direction > 0 ? "forward" : "reverse";
      st.direction = direction;
      st.boost = 0;
      st.inputReadyAt = Number.POSITIVE_INFINITY;
      st.lastInputAt = performance.now();
      st.entryDirection = direction;
      st.trapY = direction > 0 ? bounds.top : bounds.end;
      st.manualClock = direction < 0;
      st.nativePlayFailed = false;
      st.playPending = false;

      st.progressAt = performance.now();
      sectionRef.current?.setAttribute("data-video-state", "playing");
      lockScroll(true, "video-story");
      jumpScrollTo(st.trapY);
      st.lastObservedY = st.trapY;
      openVisual();
      startTrapPlayback();
    };

    const release = (direction: 1 | -1) => {
      const st = s.current;
      const bounds = getBounds();
      if (!bounds) return;

      v.pause();
      st.trapped = false;
      st.trapStarted = false;
      st.direction = 0;
      st.signedRate = 0;
      st.boost = 0;
      st.manualClock = false;
      st.trapY = 0;
      st.phase = direction > 0 ? "releasedDown" : "releasedUp";

      sectionRef.current?.setAttribute("data-video-state", direction > 0 ? "finished" : "rewound");
      jumpScrollTo(direction > 0 ? bounds.end + 2 : Math.max(0, bounds.top - 2));
      st.lastObservedY = window.scrollY;
      lockScroll(false, "video-story");
    };

    const addImpulse = (delta: number) => {
      const st = s.current;
      if (!st.trapped || !st.trapStarted) return;
      const now = performance.now();
      if (now < st.inputReadyAt || Math.abs(delta) < INPUT_DEADZONE) return;

      const normalized = clamp(delta, -240, 240);
      const nextDirection: 1 | -1 = normalized > 0 ? 1 : -1;
      const eventBoost = MAX_BOOST * (1 - Math.exp(-Math.abs(normalized) * WHEEL_CURVE));

      // Cambiar de sentido NO tiene que vencer la energía acumulada del sentido
      // anterior. Se cambia la intención inmediatamente y la velocidad visual
      // cruza 0 de forma amortiguada en el ticker.
      if (nextDirection !== st.direction) {
        st.direction = nextDirection;
        st.boost = eventBoost;
      } else {
        st.boost = clamp(Math.max(st.boost, eventBoost) + eventBoost * 0.2, 0, MAX_BOOST);
      }
      st.lastInputAt = now;
    };

    const onWheel = (e: WheelEvent) => {
      if (isReturningToTop() || e.ctrlKey) return;
      if ((e.target as HTMLElement | null)?.closest?.("[role=dialog], [data-lenis-prevent]")) return;
      const st = s.current;
      const multiplier = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const delta = e.deltaY * multiplier;

      // Puerta predictiva: si un único gesto de rueda/trackpad es tan grande que
      // cruzaría la sección antes de que llegue el siguiente frame, lo detenemos
      // aquí mismo, antes de que Lenis/navegador muevan la página.
      if (!st.trapped && delta !== 0) {
        const bounds = getBounds();
        if (bounds) {
          const y = window.scrollY;
          const projected = y + delta;
          const entry = videoEntry(st.phase, y, projected, bounds);

          if (entry) {
            e.preventDefault();
            engage(entry);
            return;
          }
        }
      }

      if (!st.trapped) return;
      e.preventDefault();
      addImpulse(delta);
    };

    const onScrollGate = () => {
      const st = s.current;
      const y = window.scrollY;
      const prevY = st.lastObservedY;
      if (isReturningToTop()) { st.lastObservedY = y; return; }

      // Mientras la escena está capturada, scrollY no es una fuente de verdad:
      // la página debe permanecer físicamente clavada al punto de entrada. Esto
      // absorbe inercia pendiente de Lenis/navegador, PageDown, trackpads rápidos
      // y cualquier scroll nativo que haya quedado en vuelo tras la captura.
      if (st.trapped) {
        if (Math.abs(y - st.trapY) > 0.5) jumpScrollTo(st.trapY);
        st.lastObservedY = st.trapY;
        return;
      }

      st.lastObservedY = y;
      if (y === prevY) return;

      const bounds = getBounds();
      if (!bounds) return;
      const entry = videoEntry(st.phase, prevY, y, bounds);
      if (entry) engage(entry);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!e.touches.length) return;
      s.current.touchY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isReturningToTop()) return;
      if ((e.target as HTMLElement | null)?.closest?.("[role=dialog], [data-lenis-prevent]")) return;
      const st = s.current;
      if (!e.touches.length || e.touches.length > 1) return;
      const y = e.touches[0].clientY;
      const delta = st.touchY === null ? 0 : st.touchY - y;
      st.touchY = y;
      if (!st.trapped) {
        const bounds = getBounds();
        if (bounds) {
          const current = window.scrollY;
          const entry = videoEntry(st.phase, current, current + delta, bounds);
          if (entry) { e.preventDefault(); engage(entry); }
        }
        return;
      }
      e.preventDefault();
      addImpulse(delta);
    };

    const onTouchEnd = () => {
      s.current.touchY = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (isReturningToTop()) return;
      const st = s.current;
      const target = e.target as HTMLElement | null;
      // Escribir en el formulario o activar controles nunca debe mover la escena.
      if (e.ctrlKey || e.metaKey || e.altKey || target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (e.key === " " && target?.closest("button, a")) return;
      let delta = 0;
      let projectedDistance = 0;
      if (e.key === "ArrowDown") { delta = 80; projectedDistance = 80; }
      else if (e.key === "PageDown" || (e.key === " " && !e.shiftKey)) { delta = 180; projectedDistance = window.innerHeight * 0.9; }
      else if (e.key === "ArrowUp") { delta = -80; projectedDistance = -80; }
      else if (e.key === "PageUp" || (e.key === " " && e.shiftKey)) { delta = -180; projectedDistance = -window.innerHeight * 0.9; }
      else if (e.key === "Home") { delta = -240; projectedDistance = -Number.POSITIVE_INFINITY; }
      else if (e.key === "End") { delta = 240; projectedDistance = Number.POSITIVE_INFINITY; }
      if (!delta) return;

      if (!st.trapped) {
        const bounds = getBounds();
        if (bounds) {
          const y = window.scrollY;
          const projected = y + projectedDistance;
          const entry = videoEntry(st.phase, y, projected, bounds);
          if (entry) {
            e.preventDefault();
            engage(entry);
            return;
          }
        }
      }

      if (!st.trapped) return;
      e.preventDefault();
      addImpulse(delta);
    };

    const onResize = () => {
      const st = s.current;
      const bounds = getBounds();
      if (!bounds) return;
      if (st.trapped) {
        st.trapY = st.entryDirection > 0 ? bounds.top : bounds.end;
        st.lastObservedY = st.trapY;
        jumpScrollTo(st.trapY);
      } else st.lastObservedY = window.scrollY;
    };
    const onTopNavigation = () => {
      const st = s.current;
      v.pause();
      st.trapped = false;
      st.trapStarted = false;
      st.phase = "idle";
      st.direction = 0;
      st.signedRate = 0;
      st.boost = 0;
      st.touchY = null;
      st.manualClock = false;
      st.lastObservedY = window.scrollY;
      lockScroll(false, "video-story");
      sectionRef.current?.setAttribute("data-video-state", "idle");
      if (closingRef.current) closingRef.current.style.opacity = "0";
      setChapter(-1, false);
      resetVisual();
    };
    window.addEventListener(TOP_NAVIGATION, onTopNavigation);
    window.addEventListener("resize", onResize);
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });
    window.addEventListener("scroll", onScrollGate, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false, capture: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true, capture: true });
    window.addEventListener("keydown", onKeyDown, { capture: true });

    s.current.lastObservedY = window.scrollY;
    const initialBounds = getBounds();
    if (manualStartRef.current || (initialBounds && window.scrollY >= initialBounds.top && window.scrollY <= initialBounds.end)) {
      manualStartRef.current = false;
      engage(1);
    }

    const unsubscribe = addFrame((_time, dt) => {
      const st = s.current;
      const bounds = getBounds();
      if (!bounds) return;
      const y = window.scrollY;

      if (!st.trapped) {
        const nextPhase = rearmVideo(st.phase, y, bounds);
        if (nextPhase !== st.phase && st.phase === "releasedUp") resetVisual();
        st.phase = nextPhase;
        return;
      }

      // La puerta puede atraparnos antes de que loadedmetadata haya terminado.
      // En ese caso seguimos bloqueando la página y arrancamos en cuanto el
      // vídeo está listo, sin perder la captura por un scroll demasiado rápido.
      // Una descarga detenida no puede encerrar al visitante indefinidamente.
      if (document.hidden) { v.pause(); st.progressAt = performance.now(); return; }
      const now = performance.now();
      if (Math.abs(v.currentTime - st.lastMediaTime) > 0.015) {
        st.lastMediaTime = v.currentTime;
        st.progressAt = now;
      }
      if (statusRef.current) {
        statusRef.current.textContent = !st.ready || v.readyState < 2 ? "Cargando el recorrido…" : "";
      }
      if (now - st.progressAt > 15000) { setFailed(true); return; }
      if (!st.ready) return;
      if (!st.trapStarted) startTrapPlayback();

      const safeDt = Math.max(1 / 120, Math.min(0.05, dt));
      st.boost *= Math.exp(-INPUT_DECAY * safeDt);
      if (st.boost < 0.01) st.boost = 0;

      const wantedSign = st.direction || 1;
      const signMismatch = st.signedRate !== 0 && Math.sign(st.signedRate) !== wantedSign;

      if (signMismatch) {
        // Frenada en dos fases: primero disipamos la velocidad actual hacia 0
        // SIN apuntar todavía a una gran velocidad opuesta. Esto elimina el
        // latigazo visual que producía un target +8 -> -8 en un solo paso.
        st.signedRate *= Math.exp(-CROSS_DAMPING * safeDt);
        if (Math.abs(st.signedRate) <= 0.055) st.signedRate = wantedSign * 0.055;
      } else {
        const targetRate = wantedSign * (1 + st.boost);
        const accelerating = Math.abs(targetRate) > Math.abs(st.signedRate);
        // Limitamos cuánto puede cambiar la velocidad en un solo frame. Sigue
        // reaccionando rápido al scroll, pero nunca pega un salto de varios ×
        // entre dos frames cuando llega una ráfaga fuerte de rueda/trackpad.
        const maxRateStep = (accelerating ? 14 : 7) * safeDt;
        st.signedRate += clamp(targetRate - st.signedRate, -maxRateStep, maxRateStep);
      }

      if (st.signedRate > ZERO_CROSS_RATE) {
        const rate = clamp(st.signedRate, MIN_NATIVE_RATE, MAX_RATE);
        if (st.manualClock) {
          const quantized = Math.round(st.virtualTime * FRAME_RATE) / FRAME_RATE;
          if (Math.abs(v.currentTime - quantized) >= 1 / FRAME_RATE) v.currentTime = quantized;
          st.manualClock = false;
        }
        if (st.nativePlayFailed) {
          v.pause();
          st.virtualTime = Math.min(st.duration, st.virtualTime + rate * safeDt);
          const quantized = Math.round(st.virtualTime * FRAME_RATE) / FRAME_RATE;
          if (!v.seeking && Math.abs(v.currentTime - quantized) >= 1 / FRAME_RATE) v.currentTime = quantized;
        } else {
          ensureForwardPlayback(rate);
          st.virtualTime = v.currentTime;
        }
      } else {
        // Cerca del punto muerto usamos un único reloj virtual para ambos
        // sentidos. Así el cruce positivo -> 0 -> negativo no alterna entre
        // play/pause/seek con relojes distintos y desaparece el salto.
        if (!st.manualClock) {
          st.manualClock = true;
          st.virtualTime = v.currentTime;
          v.pause();
        }
        st.virtualTime = clamp(st.virtualTime + st.signedRate * safeDt, 0, st.duration);
        const quantized = Math.round(st.virtualTime * FRAME_RATE) / FRAME_RATE;
        if (!v.seeking && Math.abs(v.currentTime - quantized) >= 1 / FRAME_RATE) v.currentTime = quantized;
      }

      const displayTime = st.manualClock || st.nativePlayFailed ? st.virtualTime : v.currentTime;

      // BUG 2: solo aquí se abre la puerta inferior, una vez terminado de verdad.
      if (st.direction > 0 && displayTime >= st.duration - 0.055) {
        const last = Math.max(0, st.duration - 1 / FRAME_RATE);
        st.virtualTime = last;
        if (Math.abs(v.currentTime - last) > 1 / FRAME_RATE) v.currentTime = last;
        release(1);
        return;
      }

      // BUG 3: la puerta superior no existe hasta que el rebobinado llega a 0.
      if (st.direction < 0 && displayTime <= 0.035) {
        st.virtualTime = 0;
        v.currentTime = 0;
        release(-1);
        return;
      }

      const progress = clamp(displayTime / st.duration, 0, 1);
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress.toFixed(5)})`;
      if (timeRef.current) timeRef.current.textContent = `${fmt(displayTime)} / ${fmt(st.duration)}`;
      if (speedRef.current) {
        const label = st.signedRate < -0.025 ? "REW" : st.signedRate > 0.025 ? "PLAY" : "HOLD";
        speedRef.current.textContent = `${label} ×${Math.abs(st.signedRate).toFixed(2)}`;
      }
      if (posterRef.current) posterRef.current.style.transform = `scale(${(1 + progress * 0.08).toFixed(4)})`;

      const chapter = CHAPTERS.findIndex((c) => displayTime >= c.time[0] && displayTime <= c.time[1]);
      setChapter(chapter, st.signedRate < 0);
      if (closingRef.current) closingRef.current.style.opacity = displayTime >= 37.05 && displayTime < 41.15 ? "1" : "0";
    }, 20);

    return () => {
      disposed = true;
      unsubscribe();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("wheel", onWheel, true);
      window.removeEventListener("scroll", onScrollGate);
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);
      window.removeEventListener("touchcancel", onTouchEnd, true);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener(TOP_NAVIGATION, onTopNavigation);
      gsap.killTweensOf([frameRef.current, ".vs-media", ".vs-hud", ...(sectionRef.current?.querySelectorAll(".vs-chapter") ?? [])]);
      lockScroll(false, "video-story");
      s.current.trapped = false;
      s.current.trapStarted = false;
      s.current.phase = "idle";
      s.current.chapter = -1;
      s.current.ready = false;
      v.pause();
    };
  }, [device.reducedMotion, useVideo]);

  return (
    <>
    <div className="video-intro relative px-5 pb-7 pt-10 text-center md:px-10">
      <SectionLabel index="06" label="Recorrido" className="justify-center" />
      <h2 className="mt-4 font-display text-[clamp(1.8rem,5vw,4.8rem)] font-medium leading-tight tracking-[-0.04em]">Entra en el universo <span className="text-gradient">SYKR4</span></h2>
    </div>
    <section
      id="recorrido"
      ref={sectionRef}
      data-gl-cover
      data-video-state={failed ? "error" : !useVideo ? "static" : undefined}
      className="relative"
      style={{ height: useVideo ? `calc(100svh + ${TRAP_BUFFER_PX}px)` : "100svh" }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        <div ref={frameRef} className="absolute inset-0 z-10 overflow-hidden bg-ink-2">
          <div className="vs-media absolute inset-0 grid place-items-center bg-ink will-change-transform">
            {useVideo ? (
              <video
                ref={videoRef}
                className="h-full w-full object-contain"
                muted
                playsInline
                preload="auto"
                poster={MEDIA.poster}
                disablePictureInPicture
                aria-label="Vídeo: viaje por las cinco áreas de SYKR4 y llegada del astronauta a su destino. Se reproduce automáticamente y responde a la velocidad y dirección del scroll."
              />
            ) : (
              <img ref={posterRef} src={MEDIA.poster} alt="Cohete de SYKR4 preparado para recorrer sus cinco áreas tecnológicas" className="h-full w-full object-contain" loading="lazy" />
            )}
          </div>
          <div className="scanlines pointer-events-none absolute inset-0 opacity-35" />
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/80 via-transparent to-ink/40" />

          <div className="vs-hud pointer-events-none invisible absolute inset-0">
            <div className="vs-hud-top absolute inset-x-0 top-0 flex items-start justify-between gap-5 p-5 pt-24 font-mono text-[10px] uppercase tracking-[0.2em] text-bone/70 md:p-10 md:pt-28">
              <div>
                <div className="text-cyan">(06) Recorrido</div>
                <div className="mt-1">Cinco áreas · un solo equipo</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span className="animate-blink h-2 w-2 rounded-full bg-red-500" /> Desplázate para avanzar
                </div>
                <span ref={speedRef} className="mt-1 block text-cyan">PLAY ×1.00</span>
                <span ref={timeRef} className="mt-1 block tabular-nums">00:00.00 / 01:16.17</span>
              </div>
            </div>

            <p ref={statusRef} role="status" className="vs-load-status absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-ink/80 px-5 py-3 text-sm text-bone" />
            <ol ref={listRef} className="vs-chapter-list absolute right-10 top-1/2 hidden -translate-y-1/2 space-y-3 font-mono text-[11px] uppercase tracking-[0.2em] lg:block">
              {CHAPTERS.map((c) => (
                <li key={c.index} data-active="false" className="group flex items-center justify-end gap-3 text-bone/35 transition-colors duration-500 data-[active=true]:text-bone">
                  {c.title}
                  <span className="h-px w-4 bg-white/30 transition-all duration-500 group-data-[active=true]:w-10 group-data-[active=true]:bg-cyan" />
                  <span className="tabular-nums">{c.index}</span>
                </li>
              ))}
            </ol>

            <div className="absolute inset-x-5 bottom-8 md:inset-x-10">
              <div className="relative h-px bg-white/15">
                <div ref={barRef} className="absolute inset-0 origin-left bg-linear-to-r from-cyan via-violet to-volt" style={{ transform: "scaleX(0)" }} />
                {CHAPTERS.map((c) => (
                  <span
                    key={c.index}
                    className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-bone/60"
                    style={{ left: `${(c.time[0] / FALLBACK_DURATION) * 100}%` }}
                  />
                ))}
              </div>
              <div className="mt-3 hidden justify-between gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-mute xl:flex">
                {CHAPTERS.map((c) => (
                  <span key={c.index} className="whitespace-nowrap">{c.index} {c.title}</span>
                ))}
              </div>
            </div>
          </div>

          <div ref={closingRef} className="pointer-events-none absolute bottom-[18vh] inset-x-6 text-center opacity-0 transition-opacity duration-500">
            <p className="font-display text-[clamp(1.8rem,5vw,4.6rem)] font-semibold tracking-tight [text-shadow:0_4px_30px_#000]">Cinco áreas. Un mismo equipo.</p>
          </div>
          {!useVideo && <div className="absolute inset-x-5 bottom-12 z-20 flex flex-col items-center gap-4 text-center">
            <p className="max-w-xl rounded-xl bg-ink/80 p-4 text-bone">{failed ? "El vídeo no ha podido cargarse. Puedes volver a intentarlo o continuar al contacto." : "Descubre nuestras cinco áreas en un viaje con el explorador de SYKR4."}</p>
            <button type="button" className="rounded-full bg-volt px-6 py-3 font-semibold text-ink" onClick={() => { manualStartRef.current = true; setFailed(false); setRequestedPlayback(true); }}>{failed ? "Reintentar vídeo" : "Reproducir recorrido"}</button>
          </div>}
          {CHAPTERS.map((c, i) => (
            <div key={c.index} className={`vs-chapter vs-ch-${i} pointer-events-none invisible absolute bottom-[15vh] left-5 right-5 opacity-0 md:left-10 lg:right-72`}>
              <div className="font-mono text-xs text-cyan">{c.index} / {String(CHAPTERS.length).padStart(2, "0")}</div>
              <h3 className="mt-3 max-w-4xl font-display text-[clamp(1.9rem,6vw,5.6rem)] font-semibold leading-[0.95] tracking-[-0.045em] [text-shadow:0_10px_40px_rgba(5,6,10,0.6)]">
                {c.title}
              </h3>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-bone/85 md:text-lg">{c.text}</p>
              <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-cyan/40 bg-ink/60 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan" />
                {c.chip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
    </>
  );
}

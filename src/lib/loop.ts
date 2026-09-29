import gsap from "gsap";

/**
 * Bucle único de render (un solo requestAnimationFrame vía gsap.ticker).
 * Todas las escenas WebGL, el cursor, el marquee y el scrub de vídeo se
 * suscriben aquí → cero rAF duplicados y un único punto para medir FPS.
 */
type FrameFn = (time: number, dt: number) => void;
interface Sub {
  fn: FrameFn;
  priority: number;
}

/** Estado del puntero, suavizado una vez por frame (no en cada evento). */
export const pointer = {
  x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
  y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  nx: 0, // -1..1
  ny: 0, // -1..1 (y hacia arriba)
  vx: 0, // velocidad px/frame (suavizada)
  vy: 0,
  speed: 0,
  moved: false,
  inside: true,
  lastMove: 0,
};

/** Estado del scroll (funciona con y sin Lenis). */
export const scrollState = { y: 0, velocity: 0, smooth: 0, direction: 1 };
export const perf = { fps: 60 };

const subs: Sub[] = [];
const tapListeners = new Set<(x: number, y: number) => void>();
let started = false;
let last = 0;
let rawX = pointer.x;
let rawY = pointer.y;
let prevX = rawX;
let prevY = rawY;
let prevScroll = 0;
let fpsTime = 0;
let fpsFrames = 0;

function onMove(e: PointerEvent) {
  rawX = e.clientX;
  rawY = e.clientY;
  if (!pointer.moved) {
    prevX = rawX;
    prevY = rawY;
    pointer.moved = true;
  }
  pointer.inside = true;
  pointer.lastMove = performance.now();
}

function onDown(e: PointerEvent) {
  onMove(e);
  tapListeners.forEach((fn) => fn(e.clientX, e.clientY));
}

function tick() {
  const now = performance.now();
  const dt = last ? Math.min(0.064, (now - last) / 1000) : 1 / 60;
  last = now;

  const dx = rawX - prevX;
  const dy = rawY - prevY;
  prevX = rawX;
  prevY = rawY;
  pointer.x = rawX;
  pointer.y = rawY;
  pointer.nx = (rawX / window.innerWidth) * 2 - 1;
  pointer.ny = -((rawY / window.innerHeight) * 2 - 1);
  pointer.vx += (dx - pointer.vx) * 0.3;
  pointer.vy += (dy - pointer.vy) * 0.3;
  pointer.speed = Math.hypot(pointer.vx, pointer.vy);

  const y = window.scrollY;
  const v = y - prevScroll;
  prevScroll = y;
  scrollState.y = y;
  scrollState.velocity = v;
  scrollState.smooth += (v - scrollState.smooth) * 0.12;
  if (v !== 0) scrollState.direction = v > 0 ? 1 : -1;

  fpsTime += dt;
  fpsFrames++;
  if (fpsTime >= 0.5) {
    perf.fps = Math.round(fpsFrames / fpsTime);
    fpsTime = 0;
    fpsFrames = 0;
  }

  const t = now / 1000;
  for (let i = 0; i < subs.length; i++) subs[i].fn(t, dt);
}

export function startLoop() {
  if (started) return;
  started = true;
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  document.documentElement.addEventListener("mouseleave", () => (pointer.inside = false));
  document.documentElement.addEventListener("mouseenter", () => (pointer.inside = true));
  gsap.ticker.add(tick);
}

/** Suscribe una función al bucle. Devuelve la función para desuscribirse. */
export function addFrame(fn: FrameFn, priority = 0) {
  const sub: Sub = { fn, priority };
  subs.push(sub);
  subs.sort((a, b) => a.priority - b.priority);
  return () => {
    const i = subs.indexOf(sub);
    if (i > -1) subs.splice(i, 1);
  };
}

export function onTap(fn: (x: number, y: number) => void) {
  tapListeners.add(fn);
  return () => {
    tapListeners.delete(fn);
  };
}

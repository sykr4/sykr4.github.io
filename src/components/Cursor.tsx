import { useEffect, useRef } from "react";
import { addFrame, pointer } from "@/lib/loop";

/**
 * Cursor personalizado: punto exacto + anillo con inercia que se estira
 * según la velocidad y cambia de estado sobre elementos interactivos.
 * [data-cursor="Texto"] muestra una etiqueta dentro del anillo.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    let rx = pointer.x;
    let ry = pointer.y;
    let scale = 1;
    let target = 1;
    let pressed = false;
    let labelMode = false;
    let vis = 0;

    const setMode = (mode: "default" | "link" | "label" | "text", text = "") => {
      ring.classList.toggle("is-link", mode === "link");
      ring.classList.toggle("is-label", mode === "label");
      ring.classList.toggle("is-text", mode === "text");
      label.classList.toggle("is-on", mode === "label");
      if (mode === "label") label.textContent = text;
      labelMode = mode === "label";
      target = mode === "label" ? 3.2 : mode === "link" ? 1.8 : mode === "text" ? 0.6 : 1;
    };

    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.("[data-cursor], a, button, input, textarea, select, [role='button']") as HTMLElement | null;
      if (!el) return setMode("default");
      if (el.dataset.cursor) return setMode("label", el.dataset.cursor);
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return setMode("text");
      setMode("link");
    };
    const onDown = () => (pressed = true);
    const onUp = () => (pressed = false);

    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });

    const off = addFrame(() => {
      vis += ((pointer.moved && pointer.inside ? 1 : 0) - vis) * 0.2;
      dot.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
      rx += (pointer.x - rx) * 0.2;
      ry += (pointer.y - ry) * 0.2;
      scale += (target * (pressed ? 0.8 : 1) - scale) * 0.18;
      const sp = labelMode ? 0 : Math.min(pointer.speed / 40, 0.45);
      const ang = Math.atan2(pointer.vy, pointer.vx);
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%) rotate(${ang}rad) scale(${scale * (1 + sp)}, ${scale * (1 - sp * 0.6)})`;
      label.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      const o = vis.toFixed(3);
      ring.style.opacity = o;
      dot.style.opacity = o;
    }, 30);

    return () => {
      off();
      root.classList.remove("has-cursor");
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[100] h-9 w-9 rounded-full border border-bone/40 opacity-0 transition-[background-color,border-color,border-radius] duration-300"
      />
      <div
        ref={labelRef}
        aria-hidden
        className="cursor-label pointer-events-none fixed left-0 top-0 z-[101] whitespace-nowrap font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-ink opacity-0 transition-opacity duration-300"
      />
      <div ref={dotRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[102] h-1.5 w-1.5 rounded-full bg-bone opacity-0 mix-blend-difference" />
    </>
  );
}

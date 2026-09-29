import { useEffect, useRef } from "react";
import { FluidTrail } from "@/gl/FluidTrail";
import { addFrame, onTap } from "@/lib/loop";

/** Rastro de luz sobre TODO el contenido (mix-blend-mode: screen, sin eventos) */
export function TrailCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let trail: FluidTrail;
    try {
      trail = new FluidTrail(canvas);
    } catch {
      return;
    }
    const off = addFrame((_, dt) => trail.render(dt), 40);
    const offTap = onTap(() => trail.pulse());
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => trail.resize(), 150);
    };
    window.addEventListener("resize", onResize);
    return () => {
      off();
      offTap();
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
      trail.dispose();
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[60] h-full w-full mix-blend-screen" />;
}

import { useEffect, useRef, useState } from "react";
import { ParticleField } from "@/gl/ParticleField";
import { ScrollTrigger } from "@/lib/scroll";
import { addFrame, onTap } from "@/lib/loop";
import { DPR_BY_TIER, PARTICLES_BY_TIER } from "@/lib/device";
import { useQuality } from "@/lib/quality";

/**
 * Canvas WebGL fijo detrás de todo el contenido.
 * Las secciones declaran su estado con data-gl-state="n" y la sección de vídeo
 * con data-gl-cover (mientras el vídeo cubre la pantalla, el render se pausa).
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fieldRef = useRef<ParticleField | null>(null);
  const { device, eco, ready } = useQuality();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let field: ParticleField;
    try {
      field = new ParticleField(canvas, {
        count: PARTICLES_BY_TIER[device.tier],
        maxDpr: DPR_BY_TIER[device.tier],
        touch: device.touch,
        reducedMotion: device.reducedMotion,
      });
    } catch (err) {
      console.warn("[SYKR4] WebGL no disponible, usando fondo estático", err);
      setFailed(true);
      return;
    }
    fieldRef.current = field;

    const offFrame = addFrame((t, dt) => field.render(t, dt), 10);
    const offTap = onTap((x, y) => field.tap(x, y));
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => field.resize());
    };
    window.addEventListener("resize", onResize);

    const triggers: ScrollTrigger[] = [];
    document.querySelectorAll<HTMLElement>("[data-gl-state]").forEach((el) => {
      const s = Number(el.dataset.glState);
      triggers.push(
        ScrollTrigger.create({
          trigger: el,
          start: "top 62%",
          end: "bottom 38%",
          onToggle: (self) => {
            if (self.isActive) field.setState(s);
          },
        }),
      );
    });
    const cover = document.querySelector<HTMLElement>("[data-gl-cover]");
    if (cover) {
      triggers.push(
        ScrollTrigger.create({
          trigger: cover,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            field.covered = self.progress > 0.16 && self.progress < 0.985;
          },
          onToggle: (self) => {
            if (!self.isActive) field.covered = false;
          },
        }),
      );
    }

    return () => {
      offFrame();
      offTap();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      triggers.forEach((t) => t.kill());
      field.dispose();
      fieldRef.current = null;
    };
  }, [device]);

  useEffect(() => {
    fieldRef.current?.setEco(eco);
  }, [eco]);

  useEffect(() => {
    if (ready) fieldRef.current?.playIntro();
  }, [ready]);

  if (failed) return <StaticBackdrop />;
  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}

/** Fallback sin WebGL: degradados estáticos con la misma paleta */
export function StaticBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 [background:radial-gradient(45%_55%_at_75%_40%,rgba(92,242,255,0.16),transparent_70%),radial-gradient(40%_50%_at_20%_80%,rgba(139,92,255,0.18),transparent_70%)]"
    />
  );
}

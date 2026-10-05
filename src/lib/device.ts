/**
 * Perfil de dispositivo — se calcula UNA vez al arrancar.
 * Decide el presupuesto de partículas, el DPR máximo y qué efectos se activan
 * (rastro, cursor, distorsión WebGL, vídeo scrub o póster).
 */
export type Tier = "high" | "mid" | "low";

export interface DeviceProfile {
  tier: Tier;
  webgl2: boolean;
  touch: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  gpu: string;
}

export const PARTICLES_BY_TIER: Record<Tier, number> = { high: 24000, mid: 10000, low: 4000 };
export const DPR_BY_TIER: Record<Tier, number> = { high: 1.5, mid: 1.25, low: 1 };

type NavigatorExtra = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

let cached: DeviceProfile | null = null;

export function getDeviceProfile(): DeviceProfile {
  if (cached) return cached;
  const mq = (q: string) => window.matchMedia(q).matches;
  const nav = navigator as NavigatorExtra;

  const reducedMotion = mq("(prefers-reduced-motion: reduce)");
  const touch = mq("(hover: none)") || mq("(pointer: coarse)");
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  const eff = nav.connection?.effectiveType || "";
  const saveData = !!nav.connection?.saveData || eff === "2g" || eff === "slow-2g";

  let webgl2 = false;
  let gpu = "desconocida";
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl2 = !!gl;
    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) gpu = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
      // Liberamos el contexto de prueba inmediatamente
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl2 = false;
  }

  // GPUs software o muy antiguas → tier bajo
  const weakGpu = /swiftshader|llvmpipe|software|mali-4|mali-t\d|adreno \(tm\) [2-4]\d\d|powervr sgx/i.test(gpu);
  const small = window.innerWidth < 768;

  let tier: Tier = "high";
  if (!webgl2 || reducedMotion || saveData || cores <= 2 || memory <= 2 || weakGpu) tier = "low";
  else if (touch || small || cores <= 4 || memory <= 4) tier = "mid";

  cached = { tier, webgl2, touch, reducedMotion, saveData, gpu };
  return cached;
}

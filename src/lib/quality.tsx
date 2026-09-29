import { createContext, useContext } from "react";
import type { DeviceProfile } from "./device";

export interface QualityState {
  device: DeviceProfile;
  /** Modo eco: menos partículas, DPR 1, sin rastro ni distorsión WebGL */
  eco: boolean;
  setEco: (value: boolean) => void;
  /** true cuando el preloader ha terminado */
  ready: boolean;
}

export const QualityContext = createContext<QualityState | null>(null);

export function useQuality() {
  const ctx = useContext(QualityContext);
  if (!ctx) throw new Error("useQuality debe usarse dentro de QualityContext");
  return ctx;
}

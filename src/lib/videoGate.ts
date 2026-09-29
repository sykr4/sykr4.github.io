/** Geometry and state rules shared by native scroll, wheel, touch and keyboard. */
export type VideoPhase = "idle" | "forward" | "reverse" | "releasedDown" | "releasedUp";
export type VideoBounds = { top: number; end: number };
export type VideoDirection = -1 | 0 | 1;

/** Even a single event jumping over the entire scene must count as an entry. */
export function videoEntry(phase: VideoPhase, previous: number, next: number, bounds: VideoBounds): VideoDirection {
  if (next === previous) return 0;
  const inside = next >= bounds.top && next <= bounds.end;
  if (next > previous && (phase === "idle" || phase === "releasedUp") &&
      ((previous <= bounds.top && next >= bounds.top) || inside)) return 1;
  if (next < previous && (phase === "idle" || phase === "releasedDown") &&
      ((previous >= bounds.end && next <= bounds.end) || inside)) return -1;
  return 0;
}

/** The two-pixel release nudge is not a new visit; a real exit rearms it. */
export function rearmVideo(phase: VideoPhase, y: number, bounds: VideoBounds): VideoPhase {
  if (phase === "releasedDown" && y > bounds.end + 8) return "idle";
  if (phase === "releasedUp" && y < bounds.top - 8) return "idle";
  return phase;
}

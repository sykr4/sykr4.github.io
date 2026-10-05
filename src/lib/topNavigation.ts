/** Synchronous navigation transaction: no timer or persistent bypass can leak into a later visit. */
export const TOP_NAVIGATION = "sykr4:top-navigation";
let returningToTop = false;
let bypassingVideo = false;

export function isReturningToTop() { return returningToTop; }
export function isBypassingVideo() { return bypassingVideo; }

function navigateDirectly(jump: () => void, top: boolean, focusId?: string) {
  if (bypassingVideo) return;
  bypassingVideo = true;
  returningToTop = top;
  try {
    // Reset any active video capture before the physical jump.
    window.dispatchEvent(new Event(TOP_NAVIGATION));
    jump();
    if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
  } finally {
    returningToTop = false;
    bypassingVideo = false;
    // Sample the destination before queued native scroll events arrive.
    window.dispatchEvent(new Event(TOP_NAVIGATION));
  }
}

export function navigateDirectlyToTop(jump: () => void) {
  navigateDirectly(jump, true, "inicio");
}

/** Explicit CTA navigation can cross the video scene without arming its scroll gate. */
export function navigateDirectlyToTarget(jump: () => void) {
  navigateDirectly(jump, false);
}

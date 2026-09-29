/** Synchronous transaction: no timer or persistent bypass can leak into a later visit. */
export const TOP_NAVIGATION = "sykr4:top-navigation";
let returningToTop = false;

export function isReturningToTop() { return returningToTop; }

export function navigateDirectlyToTop(jump: () => void) {
  if (returningToTop) return;
  returningToTop = true;
  try {
    window.dispatchEvent(new Event(TOP_NAVIGATION));
    jump();
    document.getElementById("inicio")?.focus({ preventScroll: true });
  } finally {
    returningToTop = false;
    // Sample the destination before queued native scroll events arrive.
    window.dispatchEvent(new Event(TOP_NAVIGATION));
  }
}

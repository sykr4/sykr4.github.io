import { useEffect, useRef } from "react";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SCRIPT_TIMEOUT_MS = 10_000;

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | undefined;

/** Carga el script oficial una sola vez. No envía la consulta. */
export function loadTurnstileScript(doc: Document = document): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  let found = doc.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
  if (found?.dataset.turnstileState === "failed" || found?.dataset.turnstileState === "loaded") {
    found.remove();
    found = null;
  }
  const script = found ?? doc.createElement("script");
  let resolveLoad!: () => void;
  let rejectLoad!: (error: Error) => void;
  const currentPromise = new Promise<void>((resolve, reject) => {
    resolveLoad = resolve;
    rejectLoad = reject;
  });
  scriptPromise = currentPromise;
  let settled = false;
  let timeout = 0;
  const cleanup = () => {
    window.clearTimeout(timeout);
    script.removeEventListener("load", loaded);
    script.removeEventListener("error", failed);
  };
  const fail = (code: string) => {
    if (settled) return;
    settled = true;
    cleanup();
    script.dataset.turnstileState = "failed";
    script.remove();
    if (scriptPromise === currentPromise) scriptPromise = undefined;
    rejectLoad(new Error(code));
  };
  const loaded = () => {
    if (!window.turnstile) {
      fail("turnstile_unavailable");
      return;
    }
    if (settled) return;
    settled = true;
    cleanup();
    script.dataset.turnstileState = "loaded";
    resolveLoad();
  };
  const failed = () => fail("turnstile_unavailable");
  script.addEventListener("load", loaded);
  script.addEventListener("error", failed);
  timeout = window.setTimeout(() => fail("turnstile_timeout"), SCRIPT_TIMEOUT_MS);
  if (!found) {
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.turnstileState = "loading";
    doc.head.appendChild(script);
  }
  return currentPromise;
}

export function TurnstileWidget({
  siteKey,
  resetKey = 0,
  onToken,
  onError,
}: {
  siteKey: string;
  resetKey?: number;
  onToken: (token: string) => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  onTokenRef.current = onToken;
  onErrorRef.current = onError;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) return;
    let cancelled = false;
    let widgetId = "";
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !container.isConnected || !window.turnstile) return;
        widgetId = window.turnstile.render(container, {
          sitekey: siteKey,
          action: "contact",
          appearance: "interaction-only",
          language: "es",
          theme: "dark",
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {
        if (cancelled) return;
        onTokenRef.current("");
        onErrorRef.current?.();
      });
    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
      onTokenRef.current("");
    };
  }, [siteKey, resetKey]);

  return <div ref={containerRef} />;
}

import type { SVGProps } from "react";
import type { IconName } from "@/data/content";

type P = SVGProps<SVGSVGElement>;

export function LogoMark(props: P) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="sykr4-g" x1="8" y1="8" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5cf2ff" />
          <stop offset="1" stopColor="#8b5cff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" stroke="currentColor" strokeOpacity=".3" />
      <path d="M21.5 9.5h-8a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7h-8" stroke="url(#sykr4-g)" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="21.5" cy="9.5" r="1.9" fill="#d6ff4a" />
      <circle cx="10.5" cy="23.5" r="1.9" fill="#5cf2ff" />
    </svg>
  );
}

export function ArrowUpRight(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  );
}

export function ArrowDown(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}

export function Check(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function Spinner(props: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur=".8s" repeatCount="indefinite" />
      </path>
    </svg>
  );
}

/** Iconos de servicio (trazo redibujado en hover vía CSS .svc-icon) */
export function ServiceIcon({ name, className }: { name: IconName; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 64 64" className={`svc-icon ${className ?? ""}`} aria-hidden>
      {name === "server" && (
        <g {...common}>
          <rect x="10" y="10" width="44" height="12" rx="3" />
          <rect x="10" y="26" width="44" height="12" rx="3" />
          <rect x="10" y="42" width="44" height="12" rx="3" />
          <line x1="44" y1="16" x2="48" y2="16" stroke="#d6ff4a" strokeWidth="2.4" />
          <line x1="44" y1="32" x2="48" y2="32" stroke="#5cf2ff" strokeWidth="2.4" />
          <line x1="44" y1="48" x2="48" y2="48" stroke="#5cf2ff" strokeWidth="2.4" />
          <line x1="16" y1="16" x2="30" y2="16" />
          <line x1="16" y1="32" x2="26" y2="32" />
          <line x1="16" y1="48" x2="34" y2="48" />
        </g>
      )}
      {name === "shield" && (
        <g {...common}>
          <path d="M32 7 51 14v16c0 13-9 21-19 27C22 51 13 43 13 30V14Z" />
          <path d="M32 13 45 18v12c0 9-6 15-13 20-7-5-13-11-13-20V18Z" strokeOpacity=".35" />
          <rect x="25" y="28" width="14" height="13" rx="3" stroke="#5cf2ff" />
          <path d="M28 28v-4a4 4 0 0 1 8 0v4" stroke="#5cf2ff" />
          <path d="M32 33v3" stroke="#d6ff4a" strokeWidth="2" />
        </g>
      )}
      {name === "web" && (
        <g {...common}>
          <rect x="7" y="10" width="50" height="43" rx="4" />
          <path d="M7 20h50M13 15h2M20 15h2" />
          <path d="M14 28h18M14 34h14M14 40h10" stroke="#5cf2ff" />
          <path d="M37 30h13l-1 16H38Z" stroke="#5cf2ff" />
          <path d="M40 31v-4a3.5 3.5 0 0 1 7 0v4" stroke="#d6ff4a" />
        </g>
      )}
      {name === "cloud" && (
        <g {...common}>
          <path d="M20 40a10 10 0 0 1-1-19.9A14 14 0 0 1 46 22a9 9 0 0 1-1 18Z" />
          <polyline points="24 30 30 36 36 31 42 38" stroke="#d6ff4a" strokeWidth="2" />
          <path d="M32 46v10M27 51l5 5 5-5" stroke="#5cf2ff" />
        </g>
      )}
      {name === "rocket" && (
        <g {...common}>
          <path d="M32 8c9 6 12 16 10 28H22C20 24 23 14 32 8Z" />
          <circle cx="32" cy="24" r="4" stroke="#5cf2ff" />
          <path d="M22 36l-6 8 8-2M42 36l6 8-8-2" />
          <path d="M28 44c0 5 2 9 4 12 2-3 4-7 4-12" stroke="#d6ff4a" />
        </g>
      )}
      {name === "code" && (
        <g {...common}>
          <rect x="8" y="12" width="48" height="36" rx="4" />
          <line x1="8" y1="20" x2="56" y2="20" />
          <polyline points="26 29 20 34 26 39" stroke="#5cf2ff" strokeWidth="2" />
          <polyline points="38 29 44 34 38 39" stroke="#5cf2ff" strokeWidth="2" />
          <line x1="34" y1="27" x2="30" y2="41" stroke="#d6ff4a" strokeWidth="2" />
          <path d="M24 54h16M32 48v6" />
        </g>
      )}
      {name === "bot" && (
        <g {...common}>
          <rect x="14" y="20" width="36" height="28" rx="8" />
          <path d="M32 20v-7" />
          <circle cx="32" cy="11" r="3" stroke="#d6ff4a" />
          <circle cx="25" cy="33" r="3" stroke="#5cf2ff" strokeWidth="2" />
          <circle cx="39" cy="33" r="3" stroke="#5cf2ff" strokeWidth="2" />
          <path d="M26 41h12M8 30v8M56 30v8" />
        </g>
      )}
      {name === "support" && (
        <g {...common}>
          <path d="M14 36v-6a18 18 0 0 1 36 0v6" />
          <rect x="10" y="34" width="8" height="12" rx="3" stroke="#5cf2ff" />
          <rect x="46" y="34" width="8" height="12" rx="3" stroke="#5cf2ff" />
          <path d="M50 46c0 6-6 8-12 8h-4" />
          <circle cx="31" cy="54" r="2.5" stroke="#d6ff4a" />
        </g>
      )}
    </svg>
  );
}

import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...props,
});

export const IconZap = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export const IconHome = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export const IconPlug = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M12 22v-5" />
    <path d="M9 8V2" />
    <path d="M15 8V2" />
    <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
  </svg>
);

export const IconStation = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18" />
    <path d="M2 22h14" />
    <path d="M14 9h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0v-6l-3-3" />
    <path d="M7 6h4" />
  </svg>
);

export const IconClock = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export const IconBattery = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <rect x="2" y="7" width="16" height="10" rx="2" />
    <line x1="22" y1="11" x2="22" y2="13" />
    <line x1="6" y1="10" x2="6" y2="14" />
    <line x1="10" y1="10" x2="10" y2="14" />
  </svg>
);

export const IconFuel = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <line x1="3" y1="22" x2="15" y2="22" />
    <line x1="4" y1="9" x2="14" y2="9" />
    <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
    <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 5" />
  </svg>
);

export const IconRoad = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <path d="M4 22 9 2" />
    <path d="m15 2 5 20" />
    <path d="M12 7v2" />
    <path d="M12 13v2" />
    <path d="M12 19v2" />
  </svg>
);

export const IconInfo = (props: SVGProps<SVGSVGElement>) => (
  <svg {...base(props)}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

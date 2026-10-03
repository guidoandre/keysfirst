import type { SVGProps } from "react";

// 24 px grid, 2 px stroke, square caps (design system §7). Always next to a text label, or given `label`.
// The svg carries data-icon="<name>" so the pointer reactions in globals.css can move its parts: the lock's shackle
// (its first path), the clock's hands, the check's tick (pathLength 1 lets it draw in).
const PATHS = {
  lock: (
    <>
      <path d="M7 11V8a5 5 0 0 1 10 0v3" />
      <rect x="4.5" y="11" width="15" height="10" rx="1.5" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9M17 12v4M20.5 12v3" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" pathLength={1} />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  hourglass: <path d="M6 3h12M6 21h12M7.5 3v3.5L12 12l-4.5 5.5V21M16.5 3v3.5L12 12l4.5 5.5V21" />,
  "arrow-right": <path d="M4 12h15M13 6l6 6-6 6" />,
  "arrow-left": <path d="M20 12H5M11 6l-6 6 6 6" />,
  external: <path d="M7 17L17 7M9 7h8v8" />,
  return: (
    <>
      <path d="M9 4L4 9l5 5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-4" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </>
  ),
  share: (
    <>
      <path d="M12 15V3M7 8l5-5 5 5" />
      <path d="M5 13v6.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V13" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M16 15h2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  phone: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </>
  ),
  qr: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2M14 18v2" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.5l9 16.5H3z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.3v.4" />
    </>
  ),
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  door: (
    <>
      <path d="M6 21V4h12v17M3 21h18" />
      <path d="M14.5 12v1.5" />
    </>
  ),
  refresh: <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4.5h-4.5" />,
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
  logout: <path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10" />,
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
      <path d="M3.5 6.5L12 13l8.5-6.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21c.6-4 3.6-6.5 7.5-6.5s6.9 2.5 7.5 6.5" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  label,
  ...rest
}: { name: IconName; size?: number; label?: string } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      data-icon={name}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

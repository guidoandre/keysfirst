import type { ReactNode } from "react";

const INK = "#16181D";
const MARKER = "#FFE14D";
const MIST = "#F4F5F2";

function Figure({ label, width, height, children }: { label: string; width: number; height: number; children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className="h-auto w-full max-w-sm font-sans">
      {children}
    </svg>
  );
}

function Phone({ x, y, children }: { x: number; y: number; children?: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width="120" height="220" rx="16" fill="#fff" stroke={INK} strokeWidth="4" />
      <rect x="48" y="10" width="24" height="5" rx="2.5" fill={INK} />
      {children}
    </g>
  );
}

export function ScanIllustration() {
  return (
    <Figure label="The landlord's laptop shows a handover code; the tenant scans it with the phone camera" width={340} height={240}>
      <g transform="translate(10 30)">
        <rect width="200" height="130" rx="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <rect x="0" y="0" width="200" height="22" rx="8" fill={INK} />
        <text x="10" y="15" fontSize="10" fontWeight="600" fill="#fff">Key handover</text>
        <g transform="translate(66 34)">
          <rect width="68" height="68" fill="#fff" stroke={INK} strokeWidth="3" />
          <path d="M8 8h16v16H8zM44 8h16v16H44zM8 44h16v16H8zM34 34h6v6h-6zM46 46h8v8h-8zM34 50h6v8h-6z" fill={INK} />
        </g>
        <path d="M-12 138h224" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </g>
      <Phone x={210} y={10}>
        <rect x="14" y="40" width="92" height="92" rx="4" fill={MIST} />
        <path d="M22 50v-6h8M98 50v-6h-8M22 122v6h8M98 122v6h-8" stroke={MARKER} strokeWidth="4" fill="none" />
        <rect x="14" y="150" width="92" height="28" rx="6" fill={INK} />
        <text x="60" y="168" textAnchor="middle" fontSize="9" fontWeight="600" fill="#fff">I have the keys</text>
      </Phone>
    </Figure>
  );
}

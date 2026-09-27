import type { ReactNode } from "react";

const INK = "#16181D";
const MARKER = "#FFE14D";

// 56-unit grid, solid ink shapes and 4-unit strokes, one Highlighter accent (brand guidelines §5). Decorative only.
const PICTOGRAMS = {
  "pay-into-lock": (
    <>
      <path d="M18 24v-6a10 10 0 0 1 20 0v6" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="11" y="24" width="34" height="24" rx="4" fill={MARKER} stroke={INK} strokeWidth="4" />
      <path d="M33 31.5a6.5 6.5 0 1 0 0 9M22 34.5h9M22 38h9" fill="none" stroke={INK} strokeWidth="2.6" />
    </>
  ),
  "scan-at-door": (
    <>
      <rect x="6" y="6" width="22" height="44" rx="2" fill="none" stroke={INK} strokeWidth="4" />
      <circle cx="23" cy="29" r="2.4" fill={INK} />
      <rect x="31" y="18" width="19" height="32" rx="4" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
      <path d="M36 25h4v4h-4zM41.5 25h4v4h-4zM36 31h4v4h-4zM41.5 36h4v4h-4z" fill={INK} />
      <path d="M31 42h19" stroke={MARKER} strokeWidth="4" />
    </>
  ),
  "keys-change-hands": (
    <>
      <circle cx="16" cy="12" r="6" fill={INK} />
      <path d="M8 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <circle cx="36" cy="30" r="6" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M42 30h10M47 30v6" stroke={INK} strokeWidth="4" />
      <path d="M24 30h6" stroke={MARKER} strokeWidth="4" />
    </>
  ),
  "back-to-you": (
    <>
      <path d="M44 28a16 16 0 1 1-5-11.6" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M40 8v10H30" fill="none" stroke={INK} strokeWidth="4" />
      <circle cx="28" cy="28" r="8" fill={MARKER} stroke={INK} strokeWidth="3" />
    </>
  ),
  tenant: (
    <>
      <circle cx="20" cy="12" r="6" fill={INK} />
      <path d="M12 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <rect x="31" y="30" width="16" height="20" rx="3" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M35 30v-4h8v4" fill="none" stroke={INK} strokeWidth="3" />
    </>
  ),
  landlord: (
    <>
      <circle cx="18" cy="12" r="6" fill={INK} />
      <path d="M10 50V30a8 8 0 0 1 16 0v20z" fill={INK} />
      <circle cx="36" cy="30" r="5.5" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M41.5 30H50M46 30v5" stroke={INK} strokeWidth="3" />
    </>
  ),
  "fake-listing": (
    <>
      <rect x="8" y="8" width="40" height="40" rx="4" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M8 20h40" stroke={INK} strokeWidth="4" />
      <rect x="12" y="12" width="12" height="4" fill={MARKER} />
      <path d="M23 30a5 5 0 1 1 7 4.6c-1.3.6-2 1.4-2 2.9V39" fill="none" stroke={INK} strokeWidth="3.5" />
      <circle cx="28" cy="44" r="2" fill={INK} />
    </>
  ),
  deadline: (
    <>
      <path d="M28 12a18 18 0 0 1 18 18H28z" fill={MARKER} />
      <circle cx="28" cy="30" r="18" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M28 20v10l7 5" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M22 6h12" stroke={INK} strokeWidth="4" />
    </>
  ),
  "phone-wallet": (
    <>
      <rect x="16" y="4" width="24" height="48" rx="5" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="21" y="18" width="14" height="10" rx="2" fill={MARKER} stroke={INK} strokeWidth="3" />
      <path d="M25 44h6" stroke={INK} strokeWidth="4" />
    </>
  ),
  "laptop-wallet": (
    <>
      <rect x="10" y="12" width="36" height="24" rx="3" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M4 44h48" stroke={INK} strokeWidth="4" />
      <rect x="22" y="19" width="12" height="10" rx="2" fill={MARKER} stroke={INK} strokeWidth="3" />
    </>
  ),
  "share-link": (
    <>
      <rect x="6" y="22" width="24" height="12" rx="6" fill="none" stroke={INK} strokeWidth="4" />
      <rect x="26" y="22" width="24" height="12" rx="6" fill={MARKER} stroke={INK} strokeWidth="4" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type PictogramName = keyof typeof PICTOGRAMS;

export function Pictogram({ name, size = 56, className }: { name: PictogramName; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" focusable="false" className={className}>
      {PICTOGRAMS[name]}
    </svg>
  );
}

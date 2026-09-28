import type { ReactNode } from "react";

const INK = "#16181D";
const MARKER = "#FFE14D";
const MIST = "#F4F5F2";
const GREEN = "#0B7A47";

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

export function InstallIllustration() {
  return (
    <Figure label="A phone with the Phantom app icon and a laptop with the Phantom browser extension" width={340} height={240}>
      <Phone x={10} y={10}>
        <rect x="16" y="34" width="36" height="36" rx="9" fill={MIST} />
        <rect x="68" y="34" width="36" height="36" rx="9" fill={MARKER} stroke={INK} strokeWidth="3" />
        <text x="86" y="86" textAnchor="middle" fontSize="11" fontWeight="600" fill={INK}>Phantom</text>
        <rect x="16" y="96" width="36" height="36" rx="9" fill={MIST} />
        <rect x="68" y="96" width="36" height="36" rx="9" fill={MIST} />
      </Phone>
      <g transform="translate(150 50)">
        <rect width="180" height="120" rx="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <rect x="0" y="0" width="180" height="24" rx="8" fill={MIST} stroke={INK} strokeWidth="4" />
        <rect x="150" y="6" width="14" height="12" rx="3" fill={MARKER} stroke={INK} strokeWidth="2" />
        <text x="146" y="44" textAnchor="end" fontSize="11" fontWeight="600" fill={INK}>Phantom extension</text>
        <path d="M-12 128h204" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      </g>
    </Figure>
  );
}

export function DevnetIllustration() {
  const rows = ["Settings", "Developer Settings", "Testnet Mode", "Solana Devnet"];
  return (
    <Figure label="Phantom settings: Developer Settings, Testnet Mode switched on, Solana Devnet selected" width={200} height={240}>
      <Phone x={40} y={10}>
        {rows.map((row, i) => (
          <g key={row} transform={`translate(10 ${32 + i * 44})`}>
            <rect width="100" height="36" rx="6" fill={i >= 2 ? MARKER : MIST} stroke={INK} strokeWidth={i >= 2 ? 2 : 0} />
            <text x="8" y="22" fontSize="10" fontWeight="600" fill={INK}>{row}</text>
            {i === 2 && (
              <g transform="translate(74 11)">
                <rect width="20" height="14" rx="7" fill={INK} />
                <circle cx="13" cy="7" r="5" fill="#fff" />
              </g>
            )}
            {i === 3 && <path d="M80 18l4 4 8-9" stroke={INK} strokeWidth="2.5" fill="none" />}
          </g>
        ))}
      </Phone>
    </Figure>
  );
}

export function FundsIllustration() {
  return (
    <Figure label="Keysfirst on a phone: the Get test funds button and a confirmation of 1,000 Test EUR" width={200} height={240}>
      <Phone x={40} y={10}>
        <rect x="12" y="30" width="20" height="20" rx="4" fill={MARKER} />
        <text x="38" y="45" fontSize="11" fontWeight="700" fill={INK}>Keysfirst</text>
        <rect x="12" y="96" width="96" height="30" rx="6" fill={INK} />
        <text x="60" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#fff">Get test funds</text>
        <rect x="12" y="138" width="96" height="34" rx="6" fill="#E3F4EA" />
        <path d="M20 155l4 4 8-9" stroke={GREEN} strokeWidth="2.5" fill="none" />
        <text x="38" y="159" fontSize="9" fontWeight="600" fill={INK}>1,000 Test EUR</text>
      </Phone>
    </Figure>
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

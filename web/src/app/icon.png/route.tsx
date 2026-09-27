import { ImageResponse } from "next/og";

/**
 * PNG copy of public/icon.svg. Phantom draws SVG icons in Solana Pay requests as a black square,
 * so wallets get this one (the Solana Pay spec allows SVG, PNG or WebP).
 */
export function GET() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">
        <rect width="64" height="64" rx="14" fill="#047857" />
        <circle cx="24" cy="32" r="10" fill="none" stroke="#fff" strokeWidth="5" />
        <path d="M34 32h20M46 32v8M52 32v6" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
    { width: 256, height: 256 },
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const INK = "#16181D";
const MARKER = "#FFE14D";
const GRAPHITE = "#545B66";

// ImageResponse can't read next/font's woff2 files; it gets the approved TTF, read once per server instance.
const displayFont = readFile(join(process.cwd(), "assets/fonts/BarlowSemiCondensed-Bold.ttf"));

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48">
      <rect width="48" height="48" rx="10" fill={MARKER} />
      <circle cx="15" cy="24" r="6.5" fill="none" stroke={INK} strokeWidth="4" />
      <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke={INK} strokeWidth="4" strokeLinecap="square" />
    </svg>
  );
}

/** A 1200 × 630 link-preview card in the brand: plate logo, big ink title, devnet line. Flexbox only (Satori). */
export async function ogCard({ kicker, title, subtitle }: { kicker?: string; title: string; subtitle?: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#FFFFFF",
          color: INK,
          fontFamily: "Barlow Semi Condensed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark size={72} />
          <div style={{ display: "flex", fontSize: 52, marginLeft: 20, letterSpacing: -0.5 }}>Keysfirst</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {kicker ? (
            // Controller ruling R4: status labels are never uppercased, so no textTransform here (kicker prints STATUS_LABEL verbatim).
            <div style={{ display: "flex", fontSize: 30, color: GRAPHITE, letterSpacing: 2 }}>{kicker}</div>
          ) : null}
          <div style={{ display: "flex", fontSize: 80, lineHeight: 1.04, marginTop: 14, maxWidth: 1040 }}>{title}</div>
          {subtitle ? (
            <div style={{ display: "flex", fontSize: 34, lineHeight: 1.3, color: GRAPHITE, marginTop: 22, maxWidth: 1000 }}>{subtitle}</div>
          ) : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 26, color: GRAPHITE }}>
          <div style={{ display: "flex", width: 28, height: 10, background: MARKER, marginRight: 14 }} />
          Solana devnet prototype · test money only
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: "Barlow Semi Condensed", data: await displayFont, weight: 700, style: "normal" }] },
  );
}

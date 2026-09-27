import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Keysfirst: the deposit moves only when the keys do";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: 80, background: "#047857", color: "white",
        }}
      >
        <div style={{ fontSize: 44, opacity: 0.9 }}>Keysfirst</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>
          The deposit moves only when the keys do.
        </div>
        <div style={{ fontSize: 30, marginTop: 32, opacity: 0.85 }}>Solana devnet prototype · test money only</div>
      </div>
    ),
    size,
  );
}

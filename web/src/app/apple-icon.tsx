import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS home-screen icon: full-bleed Highlighter (iOS rounds the corners itself). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="180" height="180">
        <rect width="48" height="48" fill="#FFE14D" />
        <circle cx="15" cy="24" r="6.5" fill="none" stroke="#16181D" strokeWidth="4" />
        <path d="M21.5 24H39M30 24v6.5M37 24v5" stroke="#16181D" strokeWidth="4" strokeLinecap="square" />
      </svg>
    ),
    { ...size },
  );
}

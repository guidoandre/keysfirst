import { ImageResponse } from "next/og";

/**
 * The wallet request icon (Solana Pay GET) and the favicon source. PNG on purpose: Phantom draws SVG icons in
 * Solana Pay requests as a black square. `?size=` 16–512 (default 256), `?simple=1` for the small-size mark.
 */
export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const size = Math.min(512, Math.max(16, Number(params.get("size")) || 256));
  const simple = params.get("simple") === "1";
  return new ImageResponse(
    (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width={size} height={size}>
        <rect width="48" height="48" rx="10" fill="#FFE14D" />
        {simple
          ? [
              <circle key="c" cx="15" cy="24" r="7" fill="none" stroke="#16181D" strokeWidth="5" />,
              <path key="p" d="M22 24H40M31 24v7" stroke="#16181D" strokeWidth="5" strokeLinecap="square" />,
            ]
          : [
              <circle key="c" cx="15" cy="24" r="6.5" fill="none" stroke="#16181D" strokeWidth="4" />,
              <path key="p" d="M21.5 24H39M30 24v6.5M37 24v5" stroke="#16181D" strokeWidth="4" strokeLinecap="square" />,
            ]}
      </svg>
    ),
    { width: size, height: size },
  );
}

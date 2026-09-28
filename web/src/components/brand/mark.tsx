// The Keysfirst mark (brand guidelines §2): a padlock shackle over a "K" whose arms end in the two bars of an "F",
// in ink on the Highlighter plate. One geometry on a 48-unit grid, shared by the header logo, the icons and the
// link previews. Plain SVG elements only, so ImageResponse (Satori) can draw it too.

export const MARK_INK = "#16181D";
export const MARK_PLATE = "#FFE14D";

/** The shackle: a half ring with short straight legs, open at the bottom. */
const SHACKLE = "M15.85 17.6V17.2A8 8 0 0 1 31.85 17.2V17.6";
/** The K (stem, arm running into the F's top bar, leg) and the F's middle bar. */
const LETTERS =
  "M11 19.5H16.25V26.5L23.35 19.5H36.9V23.75H27.55L21.4 27.65L31.65 39.9H25.2L17.55 30.45L16.25 31.65V39.9H11Z" +
  "M27.4 27.3H36.9V31.6H27.4Z";

/**
 * The mark as an <svg>. `plate`: "rounded" (default), "square" (full-bleed, for iOS, which rounds it itself) or
 * "none" (the mono mark, ink only).
 */
export function MarkSvg({
  size,
  plate = "rounded",
  ink = MARK_INK,
  className,
}: {
  size: number;
  plate?: "rounded" | "square" | "none";
  ink?: string;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {plate !== "none" && <rect width="48" height="48" rx={plate === "rounded" ? 9 : 0} fill={MARK_PLATE} />}
      <path d={SHACKLE} fill="none" stroke={ink} strokeWidth="4.6" />
      <path d={LETTERS} fill={ink} />
    </svg>
  );
}


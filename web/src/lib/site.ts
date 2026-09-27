export const PRODUCTION_URL = "https://keysfirst.vercel.app";

/**
 * The public origin used for metadata and link previews. Comes from the build environment, never from
 * request headers, so marketing pages stay static. Vercel sets VERCEL_ENV, VERCEL_BRANCH_URL and VERCEL_URL.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === "production") return PRODUCTION_URL;
  const preview = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
  return preview ? `https://${preview}` : "http://localhost:3000";
}

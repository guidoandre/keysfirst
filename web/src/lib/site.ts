export const PRODUCTION_URL = "https://www.keysfirst.io";

/**
 * The public origin used for metadata and link previews. Comes from the build environment, never from
 * request headers, so marketing pages stay static. Vercel sets VERCEL_ENV, VERCEL_BRANCH_URL and VERCEL_URL.
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): string {
  if (env.VERCEL_ENV === "production") return PRODUCTION_URL;
  const preview = env.VERCEL_BRANCH_URL || env.VERCEL_URL;
  return preview ? `https://${preview}` : "http://localhost:3000";
}

/** The wallet pages: the (app) route group. */
const APP_ROUTES = ["/new", "/start", "/deals", "/deal"];

/**
 * True for a link into the wallet pages. Marketing pages give such links prefetch={false}: prefetching one downloads
 * the wallet code (about 200 KB) in the background of a page that doesn't use it, which slows the landing page on phones.
 * The wallet page then loads on click.
 */
export function isAppRoute(href: string): boolean {
  const path = href.split(/[?#]/)[0];
  return APP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

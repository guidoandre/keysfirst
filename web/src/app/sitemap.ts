import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

const PAGES = ["/", "/how-it-works", "/tenants", "/landlords", "/faq", "/about", "/start", "/impressum", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return PAGES.map((path) => ({ url: `${base}${path === "/" ? "" : path}`, changeFrequency: "weekly", priority: path === "/" ? 1 : 0.6 }));
}

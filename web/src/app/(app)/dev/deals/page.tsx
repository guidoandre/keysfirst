import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealsGallery } from "./DealsGallery";

export const metadata: Metadata = { title: "My deals gallery (development)", robots: { index: false } };

export default function DealsGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DealsGallery />;
}

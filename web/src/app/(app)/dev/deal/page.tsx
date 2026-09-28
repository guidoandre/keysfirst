import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DealGallery } from "./DealGallery";

export const metadata: Metadata = { title: "Deal gallery (development)", robots: { index: false } };

export default function DealGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DealGallery />;
}

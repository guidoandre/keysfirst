import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiGallery } from "./UiGallery";

export const metadata: Metadata = { title: "UI gallery (development)", robots: { index: false } };

export default function UiGalleryPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiGallery />;
}

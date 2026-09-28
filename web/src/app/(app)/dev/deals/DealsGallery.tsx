"use client";

import { DealList } from "@/app/(app)/deals/MyDeals";
import type { DealSummary } from "@/lib/dashboard";

const DAY = 86_400;
const NOW = Date.UTC(2026, 8, 29, 12, 0) / 1000;
const base = {
  landlord: "LandLord111111111111111111111111111111111111",
  tenant: "TenAnt11111111111111111111111111111111111111",
  amount: "600000000",
  createdAt: NOW - 2 * DAY,
  fundedAt: NOW - DAY,
  settledAt: 0,
};
const DEALS: DealSummary[] = [
  { ...base, address: "a1", role: "landlord", title: "Room in Vallendar", status: "funded", moveIn: NOW + 3600, deadline: NOW + 3 * DAY },
  { ...base, address: "a2", role: "tenant", title: "WG room in Koblenz, 16 m²", status: "funded", moveIn: NOW + 3 * DAY, deadline: NOW + 6 * DAY },
  { ...base, address: "a3", role: "landlord", title: "Studio near campus", status: "open", fundedAt: 0, moveIn: NOW + 10 * DAY, deadline: NOW + 13 * DAY },
  { ...base, address: "a4", role: "tenant", title: "Room in Bendorf", status: "funded", moveIn: NOW - 6 * DAY, deadline: NOW - DAY },
  { ...base, address: "a5", role: "landlord", title: "Sublet for the winter semester", status: "released", moveIn: NOW - 3 * DAY, deadline: NOW, settledAt: NOW - 3 * DAY + 420 },
  { ...base, address: "a6", role: "tenant", title: "Room that didn't exist", status: "refunded", moveIn: NOW - 9 * DAY, deadline: NOW - 6 * DAY, settledAt: NOW - 6 * DAY + 60 },
];

export function DealsGallery() {
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 lg:px-10">
      <h1 className="mb-6 font-display text-section font-bold">My deals gallery</h1>
      <DealList deals={DEALS} now={NOW} />
    </div>
  );
}

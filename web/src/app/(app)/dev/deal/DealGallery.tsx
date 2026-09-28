"use client";

import { useState } from "react";
import { DealView } from "@/components/deal/DealView";
import { Segmented } from "@/components/ui/Segmented";
import type { DealData, Phase } from "@/lib/deal-view";
import type { Role } from "@/lib/rules";

const at = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour, minute) / 1000;
const LANDLORD = "LandLord111111111111111111111111111111111111";
const TENANT = "TenAnt11111111111111111111111111111111111111";
const OTHER = "0therWa11et1111111111111111111111111111111111";
const BASE: DealData = {
  landlord: LANDLORD,
  tenant: "11111111111111111111111111111111",
  title: "Room in Vallendar",
  amount: "600000000",
  status: "open",
  moveIn: at(10, 1, 14),
  deadline: at(10, 4, 14),
  createdAt: at(9, 27, 10, 12),
  fundedAt: 0,
  settledAt: 0,
};
const FUNDED: DealData = { ...BASE, status: "funded", tenant: TENANT, fundedAt: at(9, 27, 10, 20) };

const SCENARIOS: Record<Phase, { data: DealData; now: number }> = {
  open: { data: BASE, now: at(9, 28, 9) },
  "open-too-early": { data: { ...BASE, moveIn: at(12, 1, 14), deadline: at(12, 4, 14) }, now: at(6, 1, 9) },
  "open-expired": { data: BASE, now: at(10, 5, 9) },
  "funded-before": { data: FUNDED, now: at(9, 29, 19, 18) },
  "funded-window": { data: FUNDED, now: at(10, 1, 13, 55) },
  "funded-expired": { data: FUNDED, now: at(10, 4, 15) },
  released: { data: { ...FUNDED, status: "released", settledAt: at(10, 1, 14, 7) }, now: at(10, 1, 14, 8) },
  refunded: { data: { ...FUNDED, status: "refunded", settledAt: at(10, 4, 15, 2) }, now: at(10, 4, 15, 3) },
  cancelled: { data: { ...BASE, status: "cancelled", settledAt: at(9, 27, 11) }, now: at(9, 27, 12) },
};
const ME: Record<Role, string> = { landlord: LANDLORD, tenant: TENANT, visitor: OTHER };

export function DealGallery() {
  const [phase, setPhase] = useState<Phase>("funded-window");
  const [role, setRole] = useState<Role>("landlord");
  const [connected, setConnected] = useState<"yes" | "no">("yes");
  const { data, now } = SCENARIOS[phase];
  const effectiveRole: Role = connected === "yes" ? (ME[role] === data.landlord ? "landlord" : ME[role] === data.tenant ? "tenant" : "visitor") : "visitor";

  return (
    <div className="space-y-6 py-6">
      <div className="mx-auto max-w-page space-y-4 px-4 sm:px-6 lg:px-10">
        <h1 className="font-display text-section font-bold">Deal gallery</h1>
        <Segmented
          name="phase"
          legend="Phase"
          value={phase}
          onChange={setPhase}
          options={(Object.keys(SCENARIOS) as Phase[]).map((value) => ({ value, label: value }))}
        />
        <Segmented
          name="role"
          legend="Viewer"
          value={role}
          onChange={setRole}
          options={[
            { value: "landlord", label: "Landlord" },
            { value: "tenant", label: "Tenant" },
            { value: "visitor", label: "Someone else" },
          ]}
        />
        <Segmented
          name="connected"
          legend="Wallet"
          value={connected}
          onChange={setConnected}
          options={[
            { value: "yes", label: "Logged in" },
            { value: "no", label: "Logged out" },
          ]}
        />
      </div>
      <DealView
        id="8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy"
        origin="https://keysfirst.vercel.app"
        data={data}
        role={effectiveRole}
        now={now}
        connected={connected === "yes"}
        created={phase === "open"}
        signatures={["demoCreate", "demoFund", "demoSettle"]}
        statusChanged={false}
        busy={null}
        error={null}
        signature={null}
        onAction={() => undefined}
      />
    </div>
  );
}

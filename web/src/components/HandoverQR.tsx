"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * Landlord shows this at the door. It encodes a plain https link because the iPhone Camera
 * cannot open `solana:` codes (see docs/spike.md); the linked page hands off to Phantom.
 */
export function HandoverQR({ dealId, origin }: { dealId: string; origin: string }) {
  const value = `${origin}/deal/${dealId}/handover`;
  return (
    <section className="rounded-2xl border-2 border-emerald-600 bg-white p-5 text-center">
      <h2 className="text-lg font-semibold">Key handover</h2>
      <p className="mx-auto mt-1 max-w-sm text-sm text-stone-600">
        Ask the tenant to check the room, then scan this code with their phone camera and tap “Approve in Phantom”.
        Hand over the keys only when this page says “Released”.
      </p>
      <div className="mx-auto mt-4 w-fit rounded-xl bg-white p-3">
        <QRCodeSVG value={value} size={260} marginSize={2} />
      </div>
    </section>
  );
}

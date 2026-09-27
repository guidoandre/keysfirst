"use client";

import { QRCodeSVG } from "qrcode.react";

export function SpikeQr({ value }: { value: string }) {
  return (
    <div className="mx-auto w-fit rounded-xl bg-white p-3">
      <QRCodeSVG value={value} size={280} marginSize={2} />
    </div>
  );
}

"use client";

import dynamic from "next/dynamic";

// The wallet button reads browser-only state, so it renders on the client only.
const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
  { ssr: false },
);

export function WalletButton() {
  return <WalletMultiButton />;
}

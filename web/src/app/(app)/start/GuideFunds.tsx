"use client";

import { useAccount } from "@/components/wallet/AccountProvider";
import { LoginButton } from "@/components/wallet/LoginButton";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { shortAddress } from "@/lib/format";
import { useMounted } from "@/lib/hooks";

/** Step 3 of the guide, live: log in, then get test funds right here. */
export function GuideFunds() {
  const mounted = useMounted();
  const { address: publicKey } = useAccount();
  if (!mounted || !publicKey) {
    return (
      <div className="max-w-sm">
        <LoginButton variant="primary" fullWidth />
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-fg-muted">
        Logged in as <span className="font-semibold text-fg tabular-nums">{shortAddress(publicKey.toBase58())}</span>
      </p>
      <TestFundsButton variant="primary" />
    </div>
  );
}

"use client";

import { ButtonLink } from "@/components/ui/Button";
import { LoginButton } from "@/components/wallet/LoginButton";
import { useAccount } from "@/components/wallet/AccountProvider";

/** Step 1 of the guide, live: log in, then continue. */
export function GuideLogin() {
  const { ready, label } = useAccount();
  if (!ready || !label) {
    return (
      <div className="max-w-sm">
        <LoginButton variant="primary" fullWidth />
      </div>
    );
  }
  return (
    <div className="max-w-sm space-y-3">
      <p className="text-sm text-fg-muted">
        Logged in as <span className="font-semibold text-fg">{label}</span>
      </p>
      <ButtonLink href="/new">Create a deposit link</ButtonLink>
    </div>
  );
}

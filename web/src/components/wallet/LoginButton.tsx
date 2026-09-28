"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { useConnect } from "./ConnectProvider";

export function LoginButton({
  label = "Log in",
  variant = "secondary",
  size,
  fullWidth,
}: {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}) {
  const { openConnect } = useConnect();
  const { connecting } = useWallet();
  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} loading={connecting} loadingText="Logging in…" onClick={openConnect}>
      {label}
    </Button>
  );
}

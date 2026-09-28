"use client";

import { Button, type ButtonSize, type ButtonVariant } from "@/components/ui/Button";
import { useAccount } from "./AccountProvider";

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
  const { ready, login } = useAccount();
  return (
    <Button variant={variant} size={size} fullWidth={fullWidth} disabled={!ready} onClick={login}>
      {label}
    </Button>
  );
}

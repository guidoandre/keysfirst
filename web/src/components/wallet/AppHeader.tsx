"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Logo } from "@/components/brand/Logo";
import { MobileMenu } from "@/components/site/MobileMenu";
import { NavLinks, type NavItem } from "@/components/site/NavLinks";
import { useMounted } from "@/lib/hooks";
import { LoginButton } from "./LoginButton";
import { WalletChip } from "./WalletChip";

const LOGGED_OUT: NavItem[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/start", label: "Get started" },
];
const LOGGED_IN: NavItem[] = [
  { href: "/deals", label: "My deals" },
  { href: "/new", label: "Create a deal" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
];

/** App header: role-aware navigation once a wallet is connected. */
export function AppHeader() {
  const { publicKey } = useWallet();
  const mounted = useMounted();
  const loggedIn = mounted && publicKey !== null;
  const items = loggedIn ? LOGGED_IN : LOGGED_OUT;
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-(--header-h) max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={items} />
        </nav>
        <div className="flex items-center gap-3">
          {loggedIn ? <WalletChip /> : <LoginButton size="sm" />}
          <MobileMenu items={items} />
        </div>
      </div>
    </header>
  );
}

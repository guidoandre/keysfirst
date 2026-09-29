import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { MobileMenu } from "./MobileMenu";
import { NavLinks, type NavItem } from "./NavLinks";

export const SITE_NAV: NavItem[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/#why-solana", label: "Why Solana" },
  { href: "/faq", label: "FAQ" },
];

// Cut rule: if the For tenants / For landlords pages are cut, remove them here.
const MENU: NavItem[] = [
  ...SITE_NAV.slice(0, 2),
  { href: "/tenants", label: "For tenants" },
  { href: "/landlords", label: "For landlords" },
  ...SITE_NAV.slice(2),
  // prefetch={false} on links into the wallet pages: see isAppRoute in lib/site.ts
  { href: "/start", label: "Get started", prefetch: false },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-(--header-h) max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 wide-page:max-w-wide xl:wide-page:px-16">
        <Logo />
        <div className="flex items-center gap-3 lg:gap-7">
          <nav aria-label="Main" className="hidden lg:block">
            <NavLinks items={SITE_NAV} />
          </nav>
          <ButtonLink href="/deals?login=1" prefetch={false} variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <MobileMenu items={MENU} />
        </div>
      </div>
    </header>
  );
}

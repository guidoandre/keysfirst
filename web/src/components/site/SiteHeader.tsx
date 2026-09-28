import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { cx } from "@/lib/cx";
import { MobileMenu } from "./MobileMenu";
import { NavLinks, type NavItem } from "./NavLinks";

// Cut rule: if the For tenants / For landlords pages are cut, remove them here.
export const SITE_NAV: NavItem[] = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/tenants", label: "For tenants" },
  { href: "/landlords", label: "For landlords" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-canvas">
      <div className="mx-auto flex h-(--header-h) max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavLinks items={SITE_NAV} />
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/start" className={cx(buttonClass({ variant: "quiet" }), "max-sm:hidden")}>
            Get started
          </Link>
          <ButtonLink href="/deals?login=1" variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <MobileMenu items={[...SITE_NAV, { href: "/start", label: "Get started" }]} />
        </div>
      </div>
    </header>
  );
}

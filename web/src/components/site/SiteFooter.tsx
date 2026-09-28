import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { HIT_AREA } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import idl from "@/idl/keysfirst.json";
import { cx } from "@/lib/cx";
import { explorerAddress } from "@/lib/format";
import { isAppRoute } from "@/lib/site";

// Cut rule: remove links to pages that were cut (About, For tenants, For landlords).
const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/start", label: "Get started" },
      { href: "/new", label: "Create a deposit link" },
      { href: "/deals", label: "My deals" },
    ],
  },
  {
    title: "Keysfirst",
    links: [
      { href: "/tenants", label: "For tenants" },
      { href: "/landlords", label: "For landlords" },
      { href: "/faq", label: "FAQ" },
      { href: "/about", label: "About" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-inverse text-fg-inverse">
      <div className="mx-auto grid max-w-page gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-10">
        <div className="space-y-3">
          <Logo inverse />
          <p className="max-w-xs text-fg-inverse-muted">The deposit moves only when the keys do.</p>
          <a
            href={explorerAddress(idl.address)}
            target="_blank"
            rel="noreferrer"
            className={cx("inline-flex items-center gap-1.5 text-sm underline underline-offset-2", HIT_AREA)}
          >
            The Keysfirst program on Solana Explorer
            <Icon name="external" size={14} />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="label text-fg-inverse-muted">{column.title}</p>
            {/* 44 px rows (touch targets); mt-1.5 keeps the first link where it was under the column label */}
            <ul className="mt-1.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    prefetch={isAppRoute(link.href) ? false : undefined}
                    className="inline-flex min-h-11 min-w-11 items-center underline-offset-4 hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="border-t border-white/15 px-4 py-5 text-center text-sm text-fg-inverse-muted">
        Keysfirst is a prototype on Solana devnet. Test money only; nothing here has real value. Not legal advice.
      </p>
    </footer>
  );
}

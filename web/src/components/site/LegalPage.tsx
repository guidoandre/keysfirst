import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { LEGAL_UPDATED } from "@/lib/legal";

/** Shared frame for the Impressum, privacy policy and terms: reading width, one heading, a "last updated" line. */
export function LegalPage({ label, title, lead, children }: { label: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-read px-4 pt-10 pb-16 sm:px-6 lg:pt-16">
      <p className="label enter text-fg-muted">{label}</p>
      <h1 className="enter mt-3 font-display text-title font-bold [--enter-delay:60ms]">{title}</h1>
      {lead && <p className="enter mt-4 text-lead text-fg-muted [--enter-delay:130ms]">{lead}</p>}
      <p className="enter mt-4 text-sm text-fg-muted [--enter-delay:130ms]">Last updated {LEGAL_UPDATED}</p>
      <div className="enter [--enter-delay:200ms]">{children}</div>
    </div>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10 scroll-mt-24 space-y-4 text-body">
      <h2 id={id} className="font-display text-section font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
      {children}
      <Icon name="external" size={14} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export function MailLink({ email }: { email: string }) {
  return (
    <a href={`mailto:${email}`} className="font-semibold underline underline-offset-2">
      {email}
    </a>
  );
}

import Link from "next/link";

export function DevnetRibbon() {
  return (
    <p className="bg-subtle px-4 py-2 text-center text-[0.8125rem] leading-snug text-fg-muted">
      Prototype on Solana devnet · <strong className="font-semibold text-fg">test money only</strong>, nothing here has real value ·{" "}
      <Link href="/faq#devnet" className="underline decoration-field underline-offset-2 hover:decoration-fg">
        What&apos;s devnet?
      </Link>
    </p>
  );
}

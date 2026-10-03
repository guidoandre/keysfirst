import { Icon, PlayIcon, type IconName } from "@/components/ui/Icon";
import idl from "@/idl/keysfirst.json";
import { cx } from "@/lib/cx";
import { explorerAddress } from "@/lib/format";
import { LockDiagram } from "./LockDiagram";
import { NoCryptoNote } from "./NoCryptoNote";

const FACTS: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "clock",
    title: "Final in seconds",
    text: "The landlord's payout on Solana settles in seconds and can't be charged back, so the landlord can hand over the keys the moment the screen turns green. A bank transfer can take a day.",
  },
  {
    icon: "lock",
    title: "Rules in a public program",
    text: "A program on Solana holds each deposit. Its rules allow two ways out: to the landlord when the tenant approves at the handover, or back to the tenant.",
  },
  {
    icon: "return",
    // Controller-directed deviation from the brief (honesty ruling): the devnet program can still be
    // upgraded with its upgrade key, so an absolute "nobody controls" claim is out (global constraint).
    title: "The clock decides, not a person",
    text: "After the deadline, anyone can send the deposit back to the tenant. No support ticket, no waiting for someone to decide.",
  },
];

/** Why it's safe: the lock is a program on Solana. The header's "Why Solana" link lands here (/#why-solana). */
export function WhySolana() {
  return (
    <section id="why-solana" aria-labelledby="why-solana-title" className="scroll-mt-(--header-h)">
      <div className="mx-auto max-w-wide px-4 pt-14 pb-12 sm:px-6 lg:px-10 lg:pt-24 lg:pb-20 xl:px-16">
        <div data-reveal="" className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
          <div>
            <p className="label text-fg-muted lg:text-sm">Why it&apos;s safe · Solana</p>
            <h2 id="why-solana-title" className="mt-3 font-display text-display font-bold lg:mt-4">
              The lock is a program on <span className="marker">Solana</span>.
            </h2>
          </div>
          <p className="text-[1.0625rem] leading-normal text-fg-muted lg:text-[1.1875rem]">
            Keysfirst can&apos;t take the locked deposit: a public program on Solana holds it and pays it out only by its published rules. It
            allows exactly two ways out, and Keysfirst has no button to take it.
          </p>
        </div>

        <LockDiagram />

        <ul className="mt-10 grid gap-7 md:grid-cols-3 lg:mt-16 lg:gap-10">
          {FACTS.map((fact) => (
            // data-play: the icon acts out its title when the pointer arrives (globals.css). The pop when the block arrives
            // sits on a wrapper, so a hover never restarts it.
            <li key={fact.title} data-reveal="" data-play="" className="reveal-rule pt-4.5 lg:pt-6">
              <span className="reveal-pop block w-fit">
                <PlayIcon name={fact.icon} className={cx("size-6.5 lg:size-7.5", fact.icon === "lock" && "play-hop [--hop:4px]")} />
              </span>
              <h3 className="mt-2.5 font-display text-2xl font-bold lg:mt-3">{fact.title}</h3>
              <p className="mt-1.5 leading-[1.55] text-fg-muted lg:mt-2.5 lg:text-[1.0625rem]">{fact.text}</p>
            </li>
          ))}
        </ul>

        <NoCryptoNote />

        <p data-reveal="" className="mt-6 flex max-w-[56.25rem] gap-2.5 text-sm leading-normal text-fg-muted lg:mt-8">
          <Icon name="info" size={18} className="mt-px shrink-0 max-sm:hidden" />
          <span>
            One honest caveat: on this test network the developer can still update the program with its upgrade key. Before any real money, that key would
            be locked or shared between several people.{" "}
            <a
              href={explorerAddress(idl.address)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2"
            >
              See the program on Solana Explorer
              <Icon name="external" size={14} />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </span>
        </p>
      </div>
    </section>
  );
}

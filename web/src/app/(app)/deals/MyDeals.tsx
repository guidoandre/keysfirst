"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DealCard } from "@/components/deal/DealCard";
import { AskLandlord } from "@/components/marketing/AskLandlord";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAccount } from "@/components/wallet/AccountProvider";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { LoginButton } from "@/components/wallet/LoginButton";
import { countByFilter, filterDeals, sortDeals, urgencyOf, type DealFilter, type DealSummary, type Urgency } from "@/lib/dashboard";
import { useMounted, useNow } from "@/lib/hooks";
import { useMyDeals } from "@/lib/use-my-deals";

const GROUPS: Array<{ urgency: Urgency; title: string }> = [
  { urgency: "now", title: "Needs you now" },
  { urgency: "waiting", title: "Waiting" },
  { urgency: "done", title: "Done" },
];

function Cards() {
  return (
    <div className="grid gap-3 md:grid-cols-2" aria-busy="true">
      <p role="status" className="sr-only">
        Loading your deals…
      </p>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function DealList({ deals, now }: { deals: DealSummary[]; now: number }) {
  const [filter, setFilter] = useState<DealFilter>("all");
  const counts = countByFilter(deals);
  const visible = sortDeals(filterDeals(deals, filter), now);
  return (
    <>
      <Segmented
        name="filter"
        legend="Show"
        hideLegend
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: `All (${counts.all})` },
          { value: "letting", label: `Letting (${counts.letting})` },
          { value: "renting", label: `Renting (${counts.renting})` },
        ]}
      />
      {GROUPS.map(({ urgency, title }) => {
        const items = visible.filter((d) => urgencyOf(d, now) === urgency);
        if (items.length === 0) return null;
        return (
          <section key={urgency} aria-labelledby={`group-${urgency}`} className="mt-8">
            <h2 id={`group-${urgency}`} className="label text-fg-muted">
              {title} · {items.length}
            </h2>
            {/* grid-cols-1, not the implicit auto column: a long title must truncate inside the card, not widen the page */}
            <ul className="enter-stack mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {items.map((deal) => (
                <li key={deal.address}>
                  <DealCard deal={deal} now={now} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {visible.length === 0 && <p className="mt-6 text-fg-muted">No deals in this view.</p>}
    </>
  );
}

export function MyDeals() {
  const mounted = useMounted();
  const now = useNow();
  const { ready, refreshBalance } = useAccount();
  const { state, refresh, wallet } = useMyDeals();
  // A deal released or refunded elsewhere changes the balance: read it fresh whenever this page opens.
  useEffect(() => {
    const timer = setTimeout(() => void refreshBalance(), 0);
    return () => clearTimeout(timer);
  }, [refreshBalance]);
  // A returning visitor's session is restored automatically: show the skeleton, not "Log in", while that happens.
  const waitingForWallet = !mounted || now === 0 || !ready;

  let content: ReactNode;
  if (waitingForWallet) {
    content = <Cards />;
  } else if (!wallet) {
    content = (
      <EmptyState pictogram="phone-wallet" title="Log in to see your deals" action={<LoginButton variant="primary" size="lg" />}>
        Your deals are read straight from Solana: the ones you created as a landlord and the ones you paid as a tenant.
      </EmptyState>
    );
  } else if (state.status === "error") {
    content = (
      <Callout tone="danger" role="alert" title="Couldn't load your deals">
        <p>{state.message}</p>
        <Button className="mt-3" variant="secondary" onClick={refresh}>
          Try again
        </Button>
      </Callout>
    );
  } else if (state.status !== "ready") {
    content = <Cards />;
  } else if (state.deals.length === 0) {
    content = (
      <div className="space-y-4">
        <EmptyState pictogram="laptop-wallet" title="No deals yet" action={<ButtonLink href="/new">Create a deposit link</ButtonLink>}>
          Letting a room? Create a deposit link.
        </EmptyState>
        <div className="rounded-lg bg-subtle p-5">
          <p className="font-semibold">Waiting for a link?</p>
          <p className="mt-1 text-fg-muted">It appears here once you pay. No link yet? Ask your landlord to use Keysfirst.</p>
          <div className="mt-4">
            <AskLandlord />
          </div>
        </div>
      </div>
    );
  } else {
    content = <DealList deals={state.deals} now={now} />;
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
      <div className="step-in flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-fg-muted">Your deposits</p>
          <h1 className="mt-2 font-display text-title font-bold">My deals</h1>
        </div>
        {wallet && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={refresh} disabled={state.status === "loading"}>
              <Icon name="refresh" size={18} />
              Refresh
            </Button>
            <ButtonLink href="/new">Create a deal</ButtonLink>
          </div>
        )}
      </div>
      {wallet && (
        <div className="mt-8">
          <BalanceCard />
        </div>
      )}
      <div className="mt-8">{content}</div>
    </div>
  );
}

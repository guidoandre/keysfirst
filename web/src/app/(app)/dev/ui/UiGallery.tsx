"use client";

import { useState, type ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyField } from "@/components/ui/CopyField";
import { EmptyState } from "@/components/ui/EmptyState";
import { TextField } from "@/components/ui/Field";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Segmented } from "@/components/ui/Segmented";
import { Sheet } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusChip } from "@/components/ui/StatusChip";
import { Timetable } from "@/components/ui/Timetable";
import type { DealStatus } from "@/lib/rules";

const ICONS: IconName[] = [
  "lock", "key", "check", "clock", "hourglass", "arrow-right", "external", "return", "copy", "share", "wallet", "menu",
  "close", "phone", "qr", "alert", "info", "chevron-down", "door", "refresh", "spinner", "logout",
];
const PICTOGRAMS: PictogramName[] = [
  "pay-into-lock", "scan-at-door", "keys-change-hands", "back-to-you", "tenant", "landlord", "fake-listing", "deadline",
  "phone-wallet", "laptop-wallet", "share-link",
];
const STATUSES: DealStatus[] = ["open", "funded", "released", "refunded", "cancelled"];
const BANDS: Record<DealStatus, string> = {
  open: "bg-subtle",
  funded: "bg-inverse",
  released: "bg-released",
  refunded: "bg-returned",
  cancelled: "bg-subtle",
};

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 border-t border-rule pt-6">
      <h2 className="label text-fg-muted">{title}</h2>
      {children}
    </section>
  );
}

export function UiGallery() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [windowChoice, setWindowChoice] = useState<"1d" | "3d" | "7d" | "14d">("3d");

  return (
    <div className="mx-auto max-w-page space-y-10 px-4 py-10 sm:px-6 lg:px-10">
      <h1 className="font-display text-title font-bold">UI gallery</h1>

      <Block title="Type">
        <p className="font-display text-hero font-bold">
          The deposit moves only when the <span className="marker animate-marker">keys</span> do.
        </p>
        <p className="font-display text-title font-bold">Page title</p>
        <p className="font-display text-section font-bold">Section title</p>
        <p className="font-display text-card font-bold">Card title</p>
        <p className="font-display text-amount font-bold tabular-nums">€600.00</p>
        <p className="text-lead text-fg-muted">Lead paragraph in graphite.</p>
        <p className="text-body">Body text for reading.</p>
        <p className="label text-fg-muted">Small caps label</p>
      </Block>

      <Block title="Logo">
        <div className="flex flex-wrap items-center gap-6">
          <Logo href={null} />
          <span className="rounded-md bg-inverse p-4">
            <Logo inverse href={null} />
          </span>
          <LogoMark size={64} />
          <LogoMark size={24} />
          <LogoMark size={16} />
        </div>
      </Block>

      <Block title="Icons">
        <div className="flex flex-wrap gap-4">
          {ICONS.map((name) => (
            <span key={name} className="flex w-20 flex-col items-center gap-1 text-xs text-fg-muted">
              <Icon name={name} size={24} className="text-fg" />
              {name}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Pictograms">
        <div className="flex flex-wrap gap-4">
          {PICTOGRAMS.map((name) => (
            <span key={name} className="flex w-24 flex-col items-center gap-1 rounded-md bg-subtle p-3 text-center text-xs text-fg-muted">
              <Pictogram name={name} />
              {name}
            </span>
          ))}
        </div>
      </Block>

      <Block title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Cancel this deal</Button>
          <Button variant="quiet">Quiet link</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="lg">Pay €600.00 into the lock</Button>
          <Button loading loadingText="Confirming…">
            Loading
          </Button>
          <Button disabled>Disabled</Button>
          <ButtonLink href="https://phantom.com/download" external variant="secondary">
            External link
          </ButtonLink>
        </div>
        <div className="max-w-sm">
          <Button size="lg" fullWidth>
            I have the keys: release the deposit
          </Button>
        </div>
      </Block>

      <Block title="Callouts">
        <div className="grid gap-3 sm:grid-cols-2">
          <Callout tone="info" title="Info">Use the wallet that paid.</Callout>
          <Callout tone="success" title="Success">Done. View the receipt.</Callout>
          <Callout tone="returned" title="Returned">The deposit went back to the tenant.</Callout>
          <Callout tone="danger" title="Error" role="alert">You cancelled the request in your wallet.</Callout>
          <Callout tone="neutral">Neutral note.</Callout>
        </div>
      </Block>

      <Block title="Status chips">
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusChip key={status} status={status} size="sm" />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <span key={status} className={`rounded-md p-3 ${BANDS[status]}`}>
              <StatusChip status={status} tone="onBand" />
            </span>
          ))}
        </div>
      </Block>

      <Block title="Timetable">
        <div className="max-w-xl">
          <Timetable
            title="How your €600.00 moves"
            aside="Room in Vallendar"
            footer="Rules run in a public program on Solana."
            rows={[
              { key: "a", time: "Sun 27 Sep, 10:12", title: "Deal created", state: "done" },
              { key: "b", time: "Wed 30 Sep, 14:00", title: "Key handover", detail: "Until Sun 4 Oct, 14:00.", state: "now" },
              { key: "c", time: "Sun 4 Oct, 14:00", title: "No handover by then?", detail: "€600.00 goes back to the tenant.", state: "later" },
              { key: "d", time: "Thu 1 Oct, 14:07", title: "Released to landlord", state: "done", tone: "released" },
              { key: "e", title: "Next step without a time", state: "next" },
            ]}
          />
        </div>
      </Block>

      <Block title="Form controls">
        <div className="grid max-w-xl gap-5">
          <TextField id="g-title" label="Room" hint="Your tenant sees this." counter="47 left" placeholder="Room in Vallendar" />
          <TextField id="g-amount" label="Deposit (€)" error="Enter the deposit in euros, for example 600 or 600.50." defaultValue="abc" />
          <Segmented
            name="g-window"
            legend="Latest handover"
            value={windowChoice}
            onChange={setWindowChoice}
            options={[
              { value: "1d", label: "1 day" },
              { value: "3d", label: "3 days", hint: "Default" },
              { value: "7d", label: "7 days" },
              { value: "14d", label: "14 days" },
            ]}
          />
          <CopyField label="Deposit link" value="https://keysfirst.vercel.app/deal/8cTvC1gnouTSxswytgt1as8FXgLmp1yJU6bfVopj8xTy" />
        </div>
      </Block>

      <Block title="Dialogs">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setSheet(true)}>
            Open sheet
          </Button>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            Open confirmation
          </Button>
        </div>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Your account">
          <p className="text-fg-muted">Log in with your email or Google.</p>
        </Sheet>
        <ConfirmDialog
          open={confirm}
          title="Release the deposit?"
          body="Only continue if you are holding the keys. €600.00 goes to the landlord immediately and can't be undone."
          confirmLabel="Yes, release it"
          onConfirm={() => setConfirm(false)}
          onCancel={() => setConfirm(false)}
        />
      </Block>

      <Block title="Loading and empty">
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <EmptyState pictogram="laptop-wallet" title="No deals yet" action={<Button>Create a deposit link</Button>}>
          Deals you create or pay show up here.
        </EmptyState>
      </Block>
    </div>
  );
}

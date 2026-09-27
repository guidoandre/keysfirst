import { explorerTx, formatDateTime } from "@/lib/format";
import type { DealAccount } from "@/lib/program";
import { timelineSteps, type DealStatus } from "@/lib/rules";

export function Timeline({ status, deal, signatures }: { status: DealStatus; deal: DealAccount; signatures: string[] }) {
  const steps = timelineSteps(
    status,
    { createdAt: deal.createdAt.toNumber(), fundedAt: deal.fundedAt.toNumber(), settledAt: deal.settledAt.toNumber() },
    signatures,
  );
  return (
    <ol className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
      {steps.map((step) => (
        <li key={step.label} className="flex gap-3">
          <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${step.done ? "bg-emerald-600" : "bg-stone-300"}`} />
          <div className="text-sm">
            <p className={step.done ? "font-medium" : "text-stone-500"}>{step.label}</p>
            {step.time ? <p className="text-stone-500">{formatDateTime(step.time)}</p> : null}
            {step.signature ? (
              <a className="text-emerald-800 underline" href={explorerTx(step.signature)} target="_blank" rel="noreferrer">
                View on Solana Explorer
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

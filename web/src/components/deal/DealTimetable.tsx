import { Icon } from "@/components/ui/Icon";
import { Timetable } from "@/components/ui/Timetable";
import type { DealRow } from "@/lib/deal-view";
import { explorerTx } from "@/lib/format";

export function DealTimetable({ rows, title }: { rows: DealRow[]; title: string }) {
  return (
    <Timetable
      title="Timeline"
      aside={title}
      rows={rows.map((row) => ({
        key: row.key,
        time: row.time,
        title: row.title,
        state: row.state,
        tone: row.tone,
        detail:
          row.detail || row.signature ? (
            <>
              {row.detail}
              {row.signature && (
                <>
                  {row.detail ? " " : ""}
                  <a
                    href={explorerTx(row.signature)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-fg underline underline-offset-2"
                  >
                    Receipt
                    <Icon name="external" size={13} />
                    <span className="sr-only"> on Solana Explorer (opens in a new tab)</span>
                  </a>
                </>
              )}
            </>
          ) : undefined,
      }))}
    />
  );
}

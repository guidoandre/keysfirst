import { cx } from "@/lib/cx";

export function SectionHeader({
  id,
  eyebrow,
  title,
  lead,
  align = "left",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  lead?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cx("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow && <p className="label text-fg-muted">{eyebrow}</p>}
      <h2 id={id} className="mt-3 scroll-mt-24 font-display text-section font-bold">
        {title}
      </h2>
      {lead && <p className="mt-4 text-lead text-fg-muted">{lead}</p>}
    </div>
  );
}

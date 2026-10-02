import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

/** The way back to the dashboard from a deal or the create flow, for a logged-in viewer (phones hide the header links). */
export function BackToDeals() {
  return (
    <p>
      <Link href="/deals" className={buttonClass({ variant: "quiet" })}>
        <Icon name="arrow-left" size={18} />
        Back to my deals
      </Link>
    </p>
  );
}

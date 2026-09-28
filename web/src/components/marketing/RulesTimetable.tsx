import { Timetable } from "@/components/ui/Timetable";

/** The landing hero's proof: the rulebook as a timetable (example deal). */
export function RulesTimetable() {
  return (
    <Timetable
      className="animate-rise"
      title="How your €600.00 moves"
      aside="Example"
      footer="Rules run in a public program on Solana."
      rows={[
        { key: "pay", time: "Today", title: "You pay €600.00 into the lock", detail: "From here it can only go one of two ways.", state: "now" },
        { key: "door", time: "Move-in", title: "You scan the landlord's code at the door", detail: "€600.00 goes to the landlord, in seconds.", state: "next" },
        { key: "back", time: "Deadline", title: "No handover by then?", detail: "Take the €600.00 back with one tap.", state: "later" },
      ]}
    />
  );
}

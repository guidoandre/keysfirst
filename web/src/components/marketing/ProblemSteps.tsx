import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

const STEPS: Array<{ pictogram: PictogramName; title: string; text: string }> = [
  { pictogram: "fake-listing", title: "A room appears online", text: "A nice room at a fair price, in a Facebook group or on a listing site." },
  { pictogram: "landlord", title: "The \"landlord\" is abroad", text: "They can't show you the room, but want the deposit now to \"hold\" it." },
  { pictogram: "pay-into-lock", title: "You pay. They disappear.", text: "The money is gone, and so is the listing." },
];

export function ProblemSteps() {
  return (
    <ol className="mt-10 grid gap-6 md:grid-cols-3">
      {STEPS.map((step, i) => (
        <li key={step.title} data-reveal="" className="rounded-lg border-[1.5px] border-rule bg-canvas p-5">
          <Pictogram name={step.pictogram} size={52} className="reveal-pop" />
          <p className="mt-4 font-display text-card font-bold">
            <span className="mr-2 text-fg-subtle tabular-nums">{i + 1}</span>
            {step.title}
          </p>
          <p className="mt-1 text-body text-fg-muted">{step.text}</p>
        </li>
      ))}
    </ol>
  );
}

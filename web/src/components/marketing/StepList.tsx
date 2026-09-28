import type { CSSProperties } from "react";
import { Pictogram, type PictogramName } from "@/components/brand/Pictogram";

export interface Step {
  pictogram: PictogramName;
  title: string;
  text: string;
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          {/* --pop-step: when the list scrolls into view, its pictograms settle in one after another */}
          <Pictogram name={step.pictogram} size={52} className="reveal-pop shrink-0" style={{ "--pop-step": i } as CSSProperties} />
          <div>
            <p className="font-display text-card font-bold">
              <span className="mr-2 text-fg-subtle tabular-nums">{i + 1}</span>
              {step.title}
            </p>
            <p className="mt-1 text-body text-fg-muted">{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

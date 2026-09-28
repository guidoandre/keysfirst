import { Pictogram } from "@/components/brand/Pictogram";
import type { Scenario } from "@/content/scenarios";

export function ScenarioGrid({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((s) => (
        <li key={s.id} id={s.id} data-reveal="" className="flex flex-col rounded-lg border-[1.5px] border-rule bg-canvas p-5">
          <Pictogram name={s.pictogram} size={44} className="reveal-pop" />
          <h3 className="mt-4 font-display text-card font-bold">{s.question}</h3>
          {/* flex-1 pushes the rule line to the bottom, so the rules line up across a row of cards */}
          <p className="mt-2 flex-1 text-body text-fg-muted">{s.answer}</p>
          <p className="mt-4 border-t border-rule pt-3 text-sm">
            <span className="marker font-semibold">The rule:</span> {s.rule}
          </p>
        </li>
      ))}
    </ul>
  );
}

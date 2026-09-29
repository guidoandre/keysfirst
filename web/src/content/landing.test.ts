import { describe, expect, it } from "vitest";
import { canSkipToDeadline, DEADLINE_STEP, DEMO_STEPS, nextStep, PHONE, stepLabel } from "./landing";

describe("landing demo", () => {
  it("has a screen on both phones for every step", () => {
    expect(PHONE.tenant).toHaveLength(DEMO_STEPS.length);
    expect(PHONE.landlord).toHaveLength(DEMO_STEPS.length);
  });

  it("walks the happy path, then replays from the end of either path", () => {
    expect([0, 1, 2, 3].map(nextStep)).toEqual([1, 2, 3, 0]);
    expect(nextStep(DEADLINE_STEP)).toBe(0);
  });

  it("offers the no-handover branch only while the money is in the lock", () => {
    const offered = DEMO_STEPS.map((_, step) => canSkipToDeadline(step));
    expect(offered).toEqual(DEMO_STEPS.map((step) => step.money === "lock"));
  });

  it("ends the branch with the deposit back with the tenant", () => {
    expect(DEMO_STEPS[DEADLINE_STEP]).toMatchObject({ status: "refunded", money: "tenant" });
    expect(stepLabel(DEADLINE_STEP)).toBe("Deadline.");
    expect(stepLabel(0)).toBe("Step 1 of 4.");
  });

  it("charges the tenant the card fee on top of the deposit", () => {
    expect(PHONE.tenant[0].button).toBe("Pay €621.00 by card");
  });
});

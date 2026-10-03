"use client";

import { createContext, useContext, useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ROLE_OPTIONS, type LandingRole } from "@/content/landing";

const RoleContext = createContext<{ role: LandingRole; setRole: (role: LandingRole) => void } | null>(null);
const LaterRoleContext = createContext<LandingRole>("tenant");

/**
 * Who the landing page speaks to. The toggle in the hero sets it; the hero, the problem band and the closing band read it.
 * The hero (toggle, copy, demo) follows at once; the bands further down follow a frame later (useLaterRole), so on a
 * phone the tap's own frame only carries what's on screen.
 */
export function LandingRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<LandingRole>("tenant");
  const later = useDeferredValue(role);
  const value = useMemo(() => ({ role, setRole }), [role]);
  return (
    <RoleContext value={value}>
      <LaterRoleContext value={later}>{children}</LaterRoleContext>
    </RoleContext>
  );
}

export function useLandingRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useLandingRole must be used inside LandingRoleProvider");
  return context;
}

/** The role for blocks below the hero: it follows the toggle one render later (useDeferredValue). */
export function useLaterRole() {
  return useContext(LaterRoleContext);
}

const ROLES: LandingRole[] = ["tenant", "landlord"];

/**
 * Both roles' versions of a piece of the page, stacked in one grid cell. The cell keeps the larger one's size, so a
 * switch never reflows the text or moves anything around it. The shown version glides in from its side of the toggle
 * (renting left, letting right) while the other leaves the way it came (.role-variant in globals.css); the hidden one
 * is inert: out of the tab order and the accessibility tree. `as="span"` (inline-grid) for a label inside a button or link.
 */
export function RoleSwap(props: SwapProps) {
  return <Stacked role={useLandingRole().role} {...props} />;
}

/** RoleSwap for blocks below the hero: it follows the toggle a frame later (useLaterRole) and doesn't render with the tap. */
export function LaterRoleSwap(props: SwapProps) {
  return <Stacked role={useLaterRole()} {...props} />;
}

interface SwapProps {
  tenant: ReactNode;
  landlord: ReactNode;
  as?: "div" | "span";
  className?: string;
}

function Stacked({ role, tenant, landlord, as: Tag = "div", className }: SwapProps & { role: LandingRole }) {
  return (
    <Tag className={cx(Tag === "span" ? "inline-grid" : "grid", className)}>
      {ROLES.map((variant) => (
        <Tag key={variant} data-role={variant} inert={variant !== role} className="role-variant [grid-area:1/1]">
          {variant === "tenant" ? tenant : landlord}
        </Tag>
      ))}
    </Tag>
  );
}

const LABEL = "flex h-12 items-center justify-center px-6 font-display text-[1.1875rem] font-bold lg:h-13 lg:text-[1.3125rem]";

/**
 * "I'm renting" / "I'm letting": one joined control, native radios (arrow keys move between them).
 * The ink fill slides to the chosen side carrying a white copy of the labels that slides back by the same amount, so
 * the copy stays put and each label turns white exactly where the fill covers it: no colour fade lagging the fill.
 * Both moves are one transform each on the compositor (.role-fill in globals.css); instant under reduced motion.
 */
export function RoleToggle({ className }: { className?: string }) {
  const { role, setRole } = useLandingRole();
  const letting = role === "landlord";
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="sr-only">Are you renting or letting?</legend>
      <div className="relative grid grid-cols-2 overflow-hidden rounded-[0.75rem] border-2 border-fg has-[:focus-visible]:shadow-[var(--focus-ring)] sm:inline-grid sm:rounded-lg">
        {ROLE_OPTIONS.map((option, i) => {
          const selected = option.value === role;
          return (
            // The side not chosen greys the moment a finger lands on it (active), before the tap completes.
            <label
              key={option.value}
              className={cx(LABEL, "relative cursor-pointer text-fg", i > 0 && "border-l-2 border-fg", !selected && "hover:bg-subtle active:bg-subtle active:duration-75")}
            >
              <input
                type="radio"
                name="landing-role"
                value={option.value}
                checked={selected}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
        <span aria-hidden className={cx("role-fill pointer-events-none absolute inset-y-0 left-0 w-1/2 overflow-hidden bg-inverse", letting && "translate-x-full")}>
          <span className={cx("role-fill absolute inset-y-0 left-0 grid w-[200%] grid-cols-2 text-fg-inverse", letting && "-translate-x-1/2")}>
            {ROLE_OPTIONS.map((option, i) => (
              <span key={option.value} className={cx(LABEL, i > 0 && "border-l-2 border-transparent")}>
                {option.label}
              </span>
            ))}
          </span>
        </span>
      </div>
    </fieldset>
  );
}

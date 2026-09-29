"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ROLE_OPTIONS, type LandingRole } from "@/content/landing";

const RoleContext = createContext<{ role: LandingRole; setRole: (role: LandingRole) => void } | null>(null);

/** Who the landing page speaks to. The toggle in the hero sets it; the hero, the problem band and the closing band read it. */
export function LandingRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<LandingRole>("tenant");
  return <RoleContext value={{ role, setRole }}>{children}</RoleContext>;
}

export function useLandingRole() {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useLandingRole must be used inside LandingRoleProvider");
  return context;
}

/** "I'm renting" / "I'm letting": one joined control, native radios (arrow keys move between them). */
export function RoleToggle({ className }: { className?: string }) {
  const { role, setRole } = useLandingRole();
  return (
    <fieldset className={cx("min-w-0", className)}>
      <legend className="sr-only">Are you renting or letting?</legend>
      <div className="relative grid grid-cols-2 overflow-hidden rounded-[0.75rem] border-2 border-fg has-[:focus-visible]:shadow-[var(--focus-ring)] sm:inline-grid sm:rounded-lg">
        {/* The ink fill slides to the chosen side instead of jumping (instant under reduced motion) */}
        <span
          aria-hidden
          className={cx(
            "absolute inset-y-0 left-0 w-1/2 bg-inverse transition-transform duration-300 ease-settle",
            role === "landlord" && "translate-x-full",
          )}
        />
        {ROLE_OPTIONS.map((option, i) => {
          const selected = option.value === role;
          return (
            <label
              key={option.value}
              className={cx(
                "relative flex h-12 cursor-pointer items-center justify-center px-6 font-display text-[1.1875rem] font-bold duration-300 lg:h-13 lg:text-[1.3125rem]",
                i > 0 && "border-l-2 border-fg",
                selected ? "text-fg-inverse" : "text-fg hover:bg-subtle",
              )}
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
      </div>
    </fieldset>
  );
}

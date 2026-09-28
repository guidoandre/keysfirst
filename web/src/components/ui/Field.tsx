import type { InputHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

/** Label above (never placeholder-only), optional hint, error under the field (design system §7). */
export function TextField({
  id,
  label,
  hint,
  error,
  counter,
  trailing,
  className,
  ...input
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  counter?: string;
  trailing?: ReactNode;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "className">) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        {counter && <span className="text-xs text-fg-subtle tabular-nums">{counter}</span>}
      </div>
      <div className="flex gap-2">
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            "h-(--field-h) w-full min-w-0 rounded-md bg-canvas px-3 text-base text-fg placeholder:text-fg-subtle",
            error ? "border-2 border-danger" : "border-[1.5px] border-field",
          )}
          {...input}
        />
        {trailing}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-sm text-fg-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

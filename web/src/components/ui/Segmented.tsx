import { cx } from "@/lib/cx";
import { Icon } from "./Icon";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

/** A radio group that looks like buttons. Native radios, so arrow keys move between options. */
export function Segmented<T extends string>({
  name,
  legend,
  options,
  value,
  onChange,
  hideLegend = false,
  disabled = false,
  className,
  error,
}: {
  name: string;
  legend: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hideLegend?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}) {
  return (
    <fieldset disabled={disabled} aria-describedby={error ? `${name}-error` : undefined} className={cx("min-w-0", className)}>
      <legend className={cx("mb-2 text-sm font-semibold", hideLegend && "sr-only")}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const selected = option.value === value;
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={cx(
                "flex min-h-11 cursor-pointer flex-col justify-center rounded-md border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:shadow-[var(--focus-ring)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
                selected ? "border-fg bg-inverse text-fg-inverse" : "border-field bg-canvas text-fg hover:bg-subtle",
              )}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                checked={selected}
                aria-describedby={error ? `${name}-error` : undefined}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.label}
              {option.hint && (
                <span className={cx("text-xs font-normal", selected ? "text-fg-inverse-muted" : "text-fg-muted")}>{option.hint}</span>
              )}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${name}-error`} className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-danger">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

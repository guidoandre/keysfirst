"use client";

import { useId, useRef, useState } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export function CopyField({ value, label }: { value: string; label: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Some in-app browsers block the clipboard: select the text so it can be copied by hand.
      input.current?.select();
    }
  }

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          ref={input}
          readOnly
          value={value}
          onFocus={(event) => event.currentTarget.select()}
          className="h-(--field-h) min-w-0 flex-1 rounded-md border-[1.5px] border-field bg-subtle px-3 font-mono text-sm text-fg"
        />
        <Button variant="secondary" onClick={copy} className="shrink-0">
          <Icon name={copied ? "check" : "copy"} size={18} />
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? "Copied to the clipboard" : ""}
      </p>
    </div>
  );
}

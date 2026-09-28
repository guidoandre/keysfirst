"use client";

import { BN } from "@anchor-lang/core";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Timetable } from "@/components/ui/Timetable";
import { LoginButton } from "@/components/wallet/LoginButton";
import { TestFundsButton } from "@/components/wallet/TestFundsButton";
import { cx } from "@/lib/cx";
import { formatEur, formatShortDateTime, toLocalInputValue } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { createDealIx, randomDealId } from "@/lib/instructions";
import {
  DEFAULT_WINDOW,
  DEMO_VALUES,
  handoverWindow,
  STEP_FIELDS,
  TITLE_MAX_BYTES,
  titleBytes,
  validateNewDeal,
  WINDOW_CHOICES,
  windowSeconds,
  type NewDealField,
  type WindowChoice,
} from "@/lib/new-deal";
import { getProgram } from "@/lib/program";
import { friendlyError, needsTestFunds, signAndSend } from "@/lib/send";

type Step = 1 | 2 | 3;
const STEP_TITLES: Record<Step, string> = { 1: "The room", 2: "The handover", 3: "Check and create" };
const ALL_FIELDS: NewDealField[] = ["title", "amount", "moveIn"];
const FIELD_ID: Record<NewDealField, string> = { title: "title", amount: "amount", moveIn: "move-in" };

export function CreateDealFlow() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const router = useRouter();
  const program = useMemo(() => getProgram(connection), [connection]);
  const now = useNow();
  const [step, setStep] = useState<Step>(1);
  const [checked, setChecked] = useState<NewDealField[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [moveInText, setMoveInText] = useState("");
  const [windowChoice, setWindowChoice] = useState<WindowChoice>(DEFAULT_WINDOW);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const shownStep = useRef(step);

  // After Next, Back or "Use demo values", start keyboard and screen-reader users at the new step's heading
  // (the button they pressed is gone or far below). Not on the first render.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
  }, [step]);

  // datetime-local values have no zone, so Date.parse reads them in the viewer's time zone.
  const moveIn = moveInText ? Math.floor(Date.parse(moveInText) / 1000) : Number.NaN;
  const form = { title, amount, moveIn, window: windowChoice, demo };
  const { values, errors } = validateNewDeal(form, now);
  const shown = (field: NewDealField) => (checked.includes(field) ? errors[field] : undefined);
  const handover = Number.isFinite(moveIn) ? handoverWindow(moveIn, windowSeconds(form)) : null;
  const remaining = TITLE_MAX_BYTES - titleBytes(title);

  function goNext() {
    if (step === 3) return;
    const fields = STEP_FIELDS[step];
    setChecked((previous) => [...new Set([...previous, ...fields])]);
    const invalid = fields.find((field) => errors[field]);
    if (invalid) {
      // Focus the first field in error once its message is on screen, so a screen reader reads the message too.
      setTimeout(() => document.getElementById(FIELD_ID[invalid])?.focus(), 0);
      return;
    }
    setStep(step === 1 ? 2 : 3);
  }

  function fillDemoValues() {
    setTitle(DEMO_VALUES.title);
    setAmount(DEMO_VALUES.amount);
    setMoveInText(toLocalInputValue(new Date()));
    setDemo(true);
    setChecked(ALL_FIELDS);
    setStep(3);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 3) {
      goNext();
      return;
    }
    setChecked(ALL_FIELDS);
    if (!values || !wallet.publicKey) return;
    setBusy(true);
    setError(null);
    try {
      const { ix, address } = await createDealIx(program, wallet.publicKey, {
        dealId: randomDealId(),
        amount: new BN(values.amount.toString()),
        moveIn: new BN(values.moveIn),
        deadline: new BN(values.deadline),
        title: values.title,
      });
      await signAndSend(connection, wallet, [ix]);
      router.push(`/deal/${address.toBase58()}?created=1`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-app px-4 py-8 sm:py-12">
      <p className="label text-fg-muted">Create a deposit link · Step {step} of 3</p>
      <div aria-hidden="true" className="mt-3 grid grid-cols-3 gap-1.5">
        {([1, 2, 3] as Step[]).map((n) => (
          <span key={n} className={cx("h-1.5 rounded-full transition-colors duration-300 ease-out", n <= step ? "bg-inverse" : "bg-rule")} />
        ))}
      </div>
      <h1 ref={heading} tabIndex={-1} className="mt-6 font-display text-title font-bold">
        {STEP_TITLES[step]}
      </h1>

      <form onSubmit={submit} noValidate className="mt-6 space-y-6">
        {/* Keyed by step: each step's content rises in as the flow moves on (design system §8) */}
        <div key={step} className="step-in space-y-6">
          {step === 1 && (
            <>
              <p className="text-body text-fg-muted">
                For landlords. Your tenant pays into a lock; you receive the money when they scan your code at the key handover.
              </p>
              <TextField
                id="title"
                label="Room"
                hint="Public and permanent: no names, street addresses or phone numbers. For example “Room in Vallendar, 14 m²”."
                counter={`${Math.max(remaining, 0)} left`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                error={shown("title")}
                autoComplete="off"
              />
              <TextField
                id="amount"
                label="Deposit in euros"
                hint="The exact amount your tenant pays into the lock."
                inputMode="decimal"
                placeholder="600"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                error={shown("amount")}
                autoComplete="off"
              />
              <Callout tone="neutral">
                Just trying Keysfirst?{" "}
                <button type="button" onClick={fillDemoValues} className="font-semibold underline underline-offset-2">
                  Use demo values
                </button>{" "}
                (Room in Vallendar, €600.00, move-in now, 5-minute window).
              </Callout>
            </>
          )}

          {step === 2 && (
            <>
              <TextField
                id="move-in"
                type="datetime-local"
                label="Move-in"
                hint="When your tenant gets the keys, in your time zone."
                value={moveInText}
                onChange={(event) => setMoveInText(event.target.value)}
                error={shown("moveIn")}
                trailing={
                  <Button variant="secondary" onClick={() => setMoveInText(toLocalInputValue(new Date()))}>
                    Now
                  </Button>
                }
              />
              <Segmented
                name="window"
                legend="Latest handover (after move-in)"
                value={windowChoice}
                onChange={setWindowChoice}
                disabled={demo}
                options={WINDOW_CHOICES.map((choice) => ({
                  value: choice.value,
                  label: choice.label,
                  hint: choice.value === DEFAULT_WINDOW ? "Recommended" : undefined,
                }))}
              />
              <label className="flex cursor-pointer items-start gap-3 rounded-md border-[1.5px] border-dashed border-field p-4">
                <input
                  type="checkbox"
                  checked={demo}
                  onChange={(event) => setDemo(event.target.checked)}
                  className="mt-1 size-5 shrink-0 accent-fg"
                />
                <span>
                  <span className="font-semibold">Demo: 5-minute window</span>{" "}
                  <span className="ml-1 rounded-sm bg-accent px-1.5 py-0.5 text-xs font-semibold">For trying it out</span>
                  <span className="mt-1 block text-sm text-fg-muted">
                    The deposit goes back to your tenant 5 minutes after move-in if there&apos;s no handover. Not for a real room.
                  </span>
                </span>
              </label>
              {handover && (
                <Callout tone="info" title="Handover window">
                  From {formatShortDateTime(handover.opens)} (24 hours before move-in) until {formatShortDateTime(handover.deadline)}. If
                  there&apos;s no handover by then, the deposit goes back to your tenant.
                </Callout>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {values && handover ? (
                <Timetable
                  title="How your deal runs"
                  aside={values.title}
                  footer="Creating the link costs a tiny network fee in test SOL."
                  rows={[
                    {
                      key: "pay",
                      time: `By ${formatShortDateTime(handover.deadline)}`,
                      title: `Your tenant pays ${formatEur(values.amount)} into the lock`,
                      detail: "The exact amount, from their own wallet.",
                      state: "now",
                    },
                    {
                      key: "handover",
                      time: formatShortDateTime(handover.opens),
                      title: "Key handover",
                      detail: `Until ${formatShortDateTime(handover.deadline)}. Your tenant scans your code and the money goes to you.`,
                      state: "next",
                    },
                    {
                      key: "back",
                      time: formatShortDateTime(handover.deadline),
                      title: "No handover by then?",
                      detail: "The deposit goes back to your tenant.",
                      state: "later",
                    },
                  ]}
                />
              ) : (
                <Callout tone="danger" role="alert" title="Something needs fixing">
                  {Object.values(errors).join(" ")} Use Back to correct it.
                </Callout>
              )}
              {error && (
                <Callout tone="danger" role="alert">
                  {error}
                </Callout>
              )}
              {needsTestFunds(error) && <TestFundsButton />}
            </>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:items-start sm:justify-between">
          {step > 1 ? (
            <Button variant="secondary" disabled={busy} onClick={() => setStep(step === 3 ? 2 : 1)}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button type="submit">Next</Button>
          ) : wallet.publicKey ? (
            <Button type="submit" size="lg" loading={busy} loadingText="Waiting for your wallet…" disabled={!values}>
              Create deposit link
            </Button>
          ) : (
            <div className="sm:w-80">
              <LoginButton label="Log in to create" variant="primary" size="lg" fullWidth />
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

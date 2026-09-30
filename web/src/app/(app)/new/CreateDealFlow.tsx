"use client";

import { BN } from "@anchor-lang/core";
import { useAccount } from "@/components/wallet/AccountProvider";
import { useConnection } from "@/lib/connection";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Callout } from "@/components/ui/Callout";
import { TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Timetable } from "@/components/ui/Timetable";
import { CountryLaw } from "@/components/deal/CountryLaw";
import { LoginButton } from "@/components/wallet/LoginButton";
import { COUNTRIES, getCountry, type CountryCode } from "@/content/countries";
import { capHint, housingOf } from "@/lib/country-rules";
import { cx } from "@/lib/cx";
import { formatEur, formatShortDateTime, parseEur, toLocalInputValue } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { createDealIx, randomDealId } from "@/lib/instructions";
import {
  DEFAULT_WINDOW,
  DEMO_VALUES,
  handoverWindow,
  paymentOpensAt,
  STEP_FIELDS,
  TITLE_MAX_BYTES,
  titleBytes,
  validateNewDeal,
  WINDOW_CHOICES,
  windowSeconds,
  type NewDealField,
  type WindowChoice,
} from "@/lib/new-deal";
import { dealAddress, fetchDeal, getProgram } from "@/lib/program";
import { friendlyError, needsTopUp, signAndSend } from "@/lib/send";

type Step = 1 | 2 | 3;
const STEP_TITLES: Record<Step, string> = { 1: "The room", 2: "The handover", 3: "Check and create" };
const ALL_FIELDS: NewDealField[] = ["country", "title", "rent", "amount", "moveIn"];
/** The form so far, kept for this tab: logging in with Google leaves the page and comes back to an empty form otherwise. */
const DRAFT_KEY = "keysfirst:new-deal";
const FIELD_ID: Record<NewDealField, string> = { country: `country-${COUNTRIES[0].code}`, title: "title", rent: "rent", amount: "amount", moveIn: "move-in" };

export function CreateDealFlow() {
  const { connection } = useConnection();
  const { wallet, topUp } = useAccount();
  const router = useRouter();
  const program = useMemo(() => getProgram(connection), [connection]);
  const now = useNow();
  const [step, setStep] = useState<Step>(1);
  const [checked, setChecked] = useState<NewDealField[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [country, setCountry] = useState<CountryCode | "">("");
  const [housing, setHousing] = useState("");
  const [rent, setRent] = useState("");
  const [moveInText, setMoveInText] = useState("");
  const [windowChoice, setWindowChoice] = useState<WindowChoice>(DEFAULT_WINDOW);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  /** The id of the deal last sent, per form content: a retry after an unclear failure reuses it, so it never creates a second deal. */
  const sent = useRef<{ key: string; dealId: BN } | null>(null);
  const shownStep = useRef(step);
  /** False until the saved draft has been read, so the empty first render doesn't overwrite it. */
  const draftRead = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const draft = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
        if (draft && typeof draft === "object") {
          setTitle(String(draft.title ?? ""));
          setAmount(String(draft.amount ?? ""));
          setCountry(getCountry(draft.country) ? draft.country : "");
          setHousing(String(draft.housing ?? ""));
          setRent(String(draft.rent ?? ""));
          setMoveInText(String(draft.moveInText ?? ""));
          if (WINDOW_CHOICES.some((choice) => choice.value === draft.windowChoice)) setWindowChoice(draft.windowChoice);
          setDemo(draft.demo === true);
          if (draft.step === 2 || draft.step === 3) setStep(draft.step);
        }
      } catch {
        // Storage blocked or an unreadable draft: start empty.
      }
      draftRead.current = true;
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!draftRead.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, amount, country, housing, rent, moveInText, windowChoice, demo, step }));
    } catch {
      // Storage blocked: the form just isn't kept.
    }
  }, [title, amount, country, housing, rent, moveInText, windowChoice, demo, step]);

  // After Next, Back or "Use demo values", start keyboard and screen-reader users at the new step's heading
  // (the button they pressed is gone or far below). Not on the first render.
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    heading.current?.focus();
  }, [step]);

  // datetime-local values have no zone, so Date.parse reads them in the viewer's time zone.
  const moveIn = moveInText ? Math.floor(Date.parse(moveInText) / 1000) : Number.NaN;
  const form = { country, housing, title, rent, amount, moveIn, window: windowChoice, demo };
  const { values, errors } = validateNewDeal(form, now);
  const shown = (field: NewDealField) => (checked.includes(field) ? errors[field] : undefined);
  const handover = Number.isFinite(moveIn) ? handoverWindow(moveIn, windowSeconds(form)) : null;
  const remaining = TITLE_MAX_BYTES - titleBytes(title);
  const selected = getCountry(country);
  const housingOption = selected ? housingOf(selected, housing) : null;
  const deposit = selected && housingOption ? capHint(selected, housingOption, parseEur(rent)) : null;
  // The tenant can only pay once the deposit would be locked for at most 180 days (program rule).
  const payFrom = handover && paymentOpensAt(handover.deadline) > now ? paymentOpensAt(handover.deadline) : null;
  // A past move-in is allowed (only the deadline must be ahead), but the handover is then open from the start.
  const moveInPassed = !demo && Number.isFinite(moveIn) && now > 0 && moveIn < now - 5 * 60;

  function chooseCountry(code: CountryCode | "") {
    setCountry(code);
    setHousing(getCountry(code)?.housing[0].value ?? "");
  }

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
    setCountry(DEMO_VALUES.country);
    setHousing(DEMO_VALUES.housing);
    setRent(DEMO_VALUES.rent);
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
    const key = JSON.stringify([wallet.publicKey.toBase58(), values.title, values.amount.toString(), values.moveIn, values.deadline]);
    if (sent.current?.key !== key) sent.current = { key, dealId: randomDealId() };
    const { dealId } = sent.current;
    try {
      // A retry of the same form: if the earlier attempt landed after all, open that deal instead of creating another.
      const earlier = dealAddress(wallet.publicKey, dealId);
      if (await fetchDeal(program, earlier).catch(() => null)) {
        router.push(`/deal/${earlier.toBase58()}?created=1`);
        return;
      }
      const { ix, address } = await createDealIx(program, wallet.publicKey, {
        dealId,
        amount: new BN(values.amount.toString()),
        moveIn: new BN(values.moveIn),
        deadline: new BN(values.deadline),
        title: values.title,
      });
      await signAndSend(connection, wallet, [ix]);
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // Storage blocked: nothing was kept.
      }
      router.push(`/deal/${address.toBase58()}?created=1`);
    } catch (e) {
      const message = friendlyError(e);
      if (needsTopUp(message)) void topUp();
      setError(message);
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
              <Segmented<CountryCode | "">
                name="country"
                legend="Country of the room"
                value={country}
                onChange={chooseCountry}
                error={shown("country")}
                options={COUNTRIES.map((c) => ({ value: c.code, label: c.name.replace(/^the /, "") }))}
              />
              {selected && housingOption && selected.housing.length > 1 && (
                <Segmented
                  name="housing"
                  legend={selected.question ?? "Rental type"}
                  value={housingOption.value}
                  onChange={setHousing}
                  options={selected.housing.map((option) => ({ value: option.value, label: option.label }))}
                />
              )}
              {housingOption?.months === 0 && <Callout tone="danger">{housingOption.blocked}</Callout>}
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
                id="rent"
                label="Monthly rent in euros"
                hint="The basic rent per month, without heating, water or other running costs. It sets the legal maximum for the deposit."
                inputMode="decimal"
                placeholder="300"
                value={rent}
                onChange={(event) => setRent(event.target.value)}
                error={shown("rent")}
                autoComplete="off"
              />
              <TextField
                id="amount"
                label="Deposit in euros"
                hint={deposit ?? "The exact amount your tenant pays into the lock."}
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
                (Germany, room in Vallendar, €300 rent, €600.00 deposit, move-in now, 5-minute window).
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
                    Without a handover, your tenant can take the deposit back 5 minutes after move-in. Not for a real room.
                  </span>
                </span>
              </label>
              {moveInPassed && (
                <Callout tone="neutral">That move-in is in the past, so the handover can happen as soon as your tenant has paid. Check the date.</Callout>
              )}
              {payFrom && (
                <Callout tone="neutral">
                  Your tenant can pay from {formatShortDateTime(payFrom)}, not earlier: a deposit is locked for at most 180 days. You can
                  share the link now.
                </Callout>
              )}
              {handover && (
                <Callout tone="info" title="Handover window">
                  From {formatShortDateTime(handover.opens)} (24 hours before move-in) until {formatShortDateTime(handover.deadline)}. If
                  there&apos;s no handover by then, your tenant can take the deposit back.
                </Callout>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {selected && housingOption && <CountryLaw country={selected} housing={housingOption} />}
              {values && handover ? (
                <Timetable
                  title="How your deal runs"
                  aside={values.title}
                  footer="Creating the link is free: Keysfirst covers the network costs."
                  rows={[
                    {
                      key: "pay",
                      time: payFrom
                        ? `${formatShortDateTime(payFrom)} to ${formatShortDateTime(handover.deadline)}`
                        : `By ${formatShortDateTime(handover.deadline)}`,
                      title: `Your tenant pays ${formatEur(values.amount)} into the lock`,
                      detail: payFrom
                        ? "The exact amount, by card or from their balance. Not earlier: a deposit is locked for at most 180 days."
                        : "The exact amount, by card or from their balance.",
                      state: payFrom ? "later" : "now",
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
                      detail: "Your tenant can take the deposit back.",
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
          {/* Different keys: React must not reuse the Next button as Create, or a double click on Next would create the deal
              without showing the review. */}
          {step < 3 ? (
            <Button key="next" type="submit">
              Next
            </Button>
          ) : wallet.publicKey ? (
            <Button key="create" type="submit" size="lg" loading={busy} loadingText="Creating your link…" disabled={!values}>
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

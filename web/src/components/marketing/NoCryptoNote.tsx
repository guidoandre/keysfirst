const STEPS = [
  { title: "Log in with email or Google", text: "Your account is set up for you. No wallet app to install." },
  { title: "Pay by card", text: "Keysfirst covers the network costs." },
  { title: "Withdraw to your bank", text: "The landlord moves the money out with an IBAN." },
];

/** "Do I need crypto?" Low-key on purpose: it answers the question under the Solana section and never moves into the hero. */
export function NoCryptoNote() {
  return (
    <div
      data-reveal=""
      className="mt-10 rounded-[1rem] bg-subtle px-4.5 py-5.5 lg:mt-14 lg:grid lg:grid-cols-[4fr_8fr] lg:items-start lg:gap-12 lg:rounded-xl lg:px-10 lg:py-9"
    >
      <div>
        <p className="label text-fg-muted">Do I need crypto?</p>
        <h3 className="mt-2 font-display text-[1.625rem] leading-[1.08] font-bold lg:mt-2.5 lg:text-[1.875rem] lg:leading-[1.05]">
          No. You use euros. Solana works underneath.
        </h3>
      </div>
      <div className="mt-4.5 lg:mt-0">
        <ol className="flex flex-col gap-3.5 md:grid md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="grid grid-cols-[1.25rem_1fr] gap-2 md:flex md:flex-col md:gap-1.5">
              <span className="font-display text-[0.9375rem] font-bold text-fg-muted">{i + 1}</span>
              <div>
                <p className="font-semibold md:text-[1.0625rem]">{step.title}</p>
                <p className="mt-0.5 text-[0.9375rem] leading-[1.45] text-fg-muted md:mt-1.5">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4.5 border-t border-rule pt-3.5 text-sm leading-normal text-fg-muted lg:mt-6 lg:pt-4.5 lg:text-[0.9375rem]">
          Already use a Solana wallet such as Phantom? You can log in with it and pay from it instead. It&apos;s optional.
        </p>
      </div>
    </div>
  );
}

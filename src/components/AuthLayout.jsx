/* eslint-disable react/prop-types */
import { Logo } from "./Logo";

const SAMPLE = [
  { who: "Meera", what: "Chai, Thursday", amt: "−120", out: true },
  { who: "Kabir", what: "Your half of the cab", amt: "+340", out: false },
  { who: "Ananya", what: "Movie tickets", amt: "−450", out: true },
  { who: "Rohan", what: "Paid you back", amt: "+1,000", out: false },
];

export function AuthLayout({ title, intro, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between border-r border-rule bg-paper-sunk px-12 py-10 lg:flex">
        <Logo to="/signin" />

        <div className="max-w-md">
          <p className="eyebrow">Play money · real habits</p>
          <h2 className="mt-4 font-serif text-[44px] leading-[1.05] tracking-tight">
            Settle up with friends,
            <br />
            <em className="font-normal text-ledger">without the awkward bit.</em>
          </h2>

          <div className="mt-10 -rotate-1 rounded-sm border border-rule-strong bg-paper-raised px-6 pb-4 pt-5 shadow-[0_1px_0_#c4bca9,0_18px_40px_-24px_rgba(26,26,23,0.45)]">
            <div className="flex items-baseline justify-between border-b border-dashed border-rule-strong pb-3">
              <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">This week</span>
              <span className="font-mono text-[11px] text-ink-muted">No. 0042</span>
            </div>
            <ul className="ruled">
              {SAMPLE.map((r) => (
                <li key={r.who} className="flex h-11 items-center justify-between text-sm">
                  <span>
                    {r.who} <span className="text-ink-muted">· {r.what}</span>
                  </span>
                  <span className={`num font-mono ${r.out ? "text-ink" : "text-ledger"}`}>{r.amt}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="max-w-sm text-[13px] text-ink-muted">
          PayNow is a demo. Every account starts with a random balance of ₹10,000 to ₹1,00,000
          in pretend rupees. Nothing here touches a real bank.
        </p>
      </aside>

      <main className="flex flex-col px-5 py-8 sm:px-10 lg:justify-center lg:px-16">
        <Logo to="/signin" className="mb-12 lg:hidden" />
        <div className="w-full max-w-[400px]">
          <h1 className="font-serif text-[34px] leading-tight tracking-tight">{title}</h1>
          {intro && <p className="mt-2 text-ink-soft">{intro}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 border-t border-rule pt-5 text-sm text-ink-soft">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

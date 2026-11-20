/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { forwardRef, useId } from "react";
import { initials } from "../lib/format";

export const cx = (...c) => c.filter(Boolean).join(" ");

export function Spinner({ className = "" }) {
  return (
    <span className={cx("inline-flex gap-[3px]", className)} aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 animate-tick rounded-full bg-current"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </span>
  );
}

const VARIANTS = {
  primary:
    "bg-ledger text-paper-raised hover:bg-ledger-deep active:translate-y-px disabled:bg-ink-faint",
  secondary:
    "border border-ink bg-transparent text-ink hover:bg-ink hover:text-paper-raised disabled:border-ink-faint disabled:text-ink-faint disabled:hover:bg-transparent",
  quiet: "text-ink-soft underline-offset-4 hover:text-ink hover:underline disabled:text-ink-faint",
  danger: "border border-debit text-debit hover:bg-debit hover:text-paper-raised",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-[15px]",
};

export const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, loadingText, className, children, disabled, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded font-medium transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        variant !== "quiet" && SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <Spinner />
          <span>{loadingText || children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
});

export const Field = forwardRef(function Field(
  { label, hint, error, className, inputClassName, prefix, id: idProp, ...props },
  ref
) {
  const autoId = useId();
  const id = idProp || autoId;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-medium text-ink-soft">
        {label}
      </label>
      <div
        className={cx(
          "flex items-center rounded border bg-paper-raised transition-colors focus-within:border-ink",
          error ? "border-debit" : "border-rule-strong"
        )}
      >
        {prefix && <span className="pl-3 text-ink-muted">{prefix}</span>}
        <input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cx(
            "h-11 w-full min-w-0 bg-transparent px-3 text-[15px] text-ink placeholder:text-ink-faint focus:outline-none",
            inputClassName
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-[13px] text-debit">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export function Avatar({ name, size = "md", tone = "plain" }) {
  const s = size === "lg" ? "h-12 w-12 text-base" : size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-[13px]";
  const t = tone === "ink" ? "bg-ink text-paper-raised border-ink" : "bg-paper-sunk text-ink-soft border-rule-strong";
  return (
    <span
      aria-hidden="true"
      className={cx("inline-flex shrink-0 items-center justify-center rounded border font-mono font-medium", s, t)}
    >
      {initials(name)}
    </span>
  );
}

export function Notice({ tone = "error", title, children, action }) {
  const tones = {
    error: "border-debit/40 bg-debit-soft text-debit",
    warning: "border-amber/40 bg-amber-soft text-amber",
    info: "border-rule-strong bg-paper-sunk text-ink-soft",
    success: "border-ledger/40 bg-ledger-soft text-ledger",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded border px-4 py-3 text-sm", tones[tone])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          {title && <p className="font-medium">{title}</p>}
          {children && <div className={cx(title && "mt-0.5", "text-ink-soft")}>{children}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Skeleton({ className }) {
  return <span className={cx("block animate-pulse rounded bg-paper-sunk", className)} />;
}

export function SectionHeading({ children, aside }) {
  return (
    <div className="flex items-baseline justify-between border-b border-ink pb-2">
      <h2 className="font-serif text-xl">{children}</h2>
      {aside}
    </div>
  );
}

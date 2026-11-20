/* eslint-disable react/prop-types */
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, getErrorMessage, getFieldErrors } from "../lib/api";
import { formatAmount, formatDateTime, isObjectId } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { useShell } from "./AppShell";
import { Avatar, Button, Field, Notice, cx } from "./ui";

const MAX = 1000000;
const QUICK = [100, 500, 1000, 2000];

/**
 * One form for both directions:
 *  - mode "send":    edit → review → receipt
 *  - mode "request": edit → receipt
 */
export function PaymentForm({ mode }) {
  const isSend = mode === "send";
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { account, loadAccount, loadRequests, setBalance } = useShell();

  const id = params.get("id");
  const name = (params.get("name") || "").trim() || "this person";
  const requestId = isSend && isObjectId(params.get("request")) ? params.get("request") : null;
  const lockedAmount = requestId ? Number(params.get("amount")) || null : null;

  const [amount, setAmount] = useState(() => (lockedAmount ? String(lockedAmount) : ""));
  const [note, setNote] = useState(() => (requestId ? params.get("note") || "" : ""));
  const [stage, setStage] = useState("edit");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const inFlight = useRef(false);

  const balance = account.data?.balance;
  const value = Number(amount);

  const amountError = useMemo(() => {
    if (!amount) return "Enter an amount";
    if (!Number.isInteger(value) || value <= 0) return "Enter a whole number of rupees";
    if (value > MAX) return `The limit is ₹${formatAmount(MAX)} per payment`;
    if (isSend && Number.isFinite(balance) && value > balance) {
      return `That's more than your balance of ₹${formatAmount(balance)}`;
    }
    return null;
  }, [amount, value, isSend, balance]);

  if (!isObjectId(id)) {
    return (
      <div className="max-w-md">
        <Notice tone="warning" title="We don't know who this is for">
          The link you followed is missing the recipient. Pick someone from your overview instead.
        </Notice>
        <Link to="/dashboard" className="mt-6 inline-block text-sm underline underline-offset-4">
          ← Back to overview
        </Link>
      </div>
    );
  }

  const onAmountChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, "").replace(/^0+/, "").slice(0, 7);
    setAmount(digits);
    setErrors((x) => ({ ...x, amount: undefined }));
    setFormError("");
  };

  const proceed = (e) => {
    e.preventDefault();
    setFormError("");
    if (amountError) {
      setErrors({ amount: amountError });
      return;
    }
    if (note.length > 80) {
      setErrors({ note: "Keep the note under 80 characters" });
      return;
    }
    if (isSend) setStage("review");
    else submit();
  };

  async function submit() {
    if (inFlight.current) return; // guard against double clicks
    inFlight.current = true;
    setSubmitting(true);
    setFormError("");
    try {
      if (isSend) {
        const { data } = await api.post("/bank/transfer", {
          amount_to_transfer: value,
          paye_id: id,
          note: note.trim() || undefined,
          request_id: requestId || undefined,
        });
        if (typeof data?.balance === "number") setBalance(data.balance);
        else loadAccount();
        if (requestId) loadRequests();
        setReceipt({
          ref: data?.transaction?._id,
          at: data?.transaction?.createdAt || new Date().toISOString(),
          balance: data?.balance,
        });
        toast.success(`₹${formatAmount(value)} sent to ${name}.`);
      } else {
        const { data } = await api.post("/bank/create/request", {
          amount: value,
          toId: id,
          note: note.trim() || undefined,
        });
        setReceipt({ ref: data?.data?._id, at: data?.data?.createdAt || new Date().toISOString() });
        toast.success(`Asked ${name} for ₹${formatAmount(value)}.`);
      }
      setStage("done");
    } catch (err) {
      const fields = getFieldErrors(err);
      const mapped = {
        amount: fields.amount_to_transfer || fields.amount,
        note: fields.note,
      };
      setErrors(mapped);

      if (isSend && !err.response) {
        // The request may have reached the server before the connection dropped.
        // Don't invite a blind retry that could pay twice.
        setFormError(
          "We couldn't confirm whether this payment went through. Check Recent activity on your overview before trying again."
        );
        loadAccount();
      } else {
        const msg = getErrorMessage(err, isSend ? "The payment didn't go through." : "Couldn't send the request.");
        if (/balance/i.test(msg) && isSend) {
          mapped.amount = msg;
          setErrors({ ...mapped });
          loadAccount();
        }
        setFormError(msg);
        if (err.response?.status === 409 && requestId) loadRequests();
      }
      setStage("edit");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  /* ------------------------------ Receipt ------------------------------ */
  if (stage === "done") {
    return (
      <div className="max-w-md">
        <p className="eyebrow">{isSend ? "Payment sent" : "Request sent"}</p>
        <div className="mt-4 rounded-sm border border-rule-strong bg-paper-raised px-6 py-6 shadow-[0_1px_0_#c4bca9]">
          <p className="num font-serif text-5xl tracking-tight">
            <span className="mr-1 align-top text-[0.45em] text-ink-muted">₹</span>
            {formatAmount(value)}
          </p>
          <p className="mt-2 text-ink-soft">
            {isSend ? "to" : "requested from"} <span className="text-ink">{name}</span>
          </p>
          <dl className="mt-6 space-y-2 border-t border-dashed border-rule-strong pt-4 text-[13px]">
            {note.trim() && <Row k="Note" v={`“${note.trim()}”`} />}
            <Row k="When" v={formatDateTime(receipt?.at)} />
            {receipt?.ref && <Row k="Reference" v={receipt.ref.slice(-10).toUpperCase()} mono />}
            {isSend && typeof receipt?.balance === "number" && (
              <Row k="Balance now" v={`₹${formatAmount(receipt.balance)}`} mono />
            )}
            {!isSend && <Row k="Status" v="Waiting for them to pay" />}
          </dl>
        </div>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => navigate("/dashboard")}>Back to overview</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setAmount("");
              setNote("");
              setReceipt(null);
              setStage("edit");
              if (requestId) navigate(`/send?${new URLSearchParams({ id, name })}`, { replace: true });
            }}
          >
            {isSend ? "Pay again" : "Another request"}
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------ Review ------------------------------- */
  if (stage === "review") {
    return (
      <div className="max-w-md">
        <BackLink />
        <h1 className="mt-6 font-serif text-[32px] leading-tight tracking-tight">Check the details</h1>
        <dl className="mt-6 divide-y divide-rule border-y border-rule text-sm">
          <Row k="To" v={name} big />
          <Row k="Amount" v={`₹${formatAmount(value)}`} mono big />
          {note.trim() && <Row k="Note" v={`“${note.trim()}”`} big />}
          {Number.isFinite(balance) && <Row k="Balance after" v={`₹${formatAmount(balance - value)}`} mono big />}
        </dl>
        {formError && (
          <div className="mt-5">
            <Notice tone="error">{formError}</Notice>
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <Button size="lg" onClick={submit} loading={submitting} loadingText="Sending" className="flex-1">
            Send ₹{formatAmount(value)}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setStage("edit")} disabled={submitting}>
            Edit
          </Button>
        </div>
        <p className="mt-4 text-[12px] text-ink-muted">Payments can&apos;t be undone once sent.</p>
      </div>
    );
  }

  /* ------------------------------- Edit -------------------------------- */
  return (
    <div className="max-w-md">
      <BackLink />
      <p className="eyebrow mt-6">{isSend ? (requestId ? "Paying a request" : "Pay") : "Request"}</p>
      <div className="mt-3 flex items-center gap-3">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-[28px] leading-tight tracking-tight">{name}</h1>
          <p className="text-[13px] text-ink-muted">
            {isSend ? "Money goes to their wallet instantly." : "They'll see this under Requests."}
          </p>
        </div>
      </div>

      <form onSubmit={proceed} noValidate className="mt-8 space-y-6">
        {formError && <Notice tone="error">{formError}</Notice>}

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Amount
          </label>
          <div
            className={cx(
              "flex items-baseline border-b-2 pb-1 transition-colors focus-within:border-ink",
              errors.amount ? "border-debit" : "border-rule-strong"
            )}
          >
            <span className="font-serif text-4xl text-ink-muted">₹</span>
            <input
              id="amount"
              inputMode="numeric"
              autoComplete="off"
              autoFocus={!lockedAmount}
              readOnly={Boolean(lockedAmount)}
              value={amount ? formatAmount(amount) : ""}
              onChange={onAmountChange}
              placeholder="0"
              aria-invalid={Boolean(errors.amount) || undefined}
              aria-describedby="amount-help"
              className="num w-full min-w-0 bg-transparent pl-2 font-serif text-5xl tracking-tight placeholder:text-ink-faint focus:outline-none read-only:cursor-default"
            />
          </div>
          <p id="amount-help" className={cx("mt-2 text-[13px]", errors.amount ? "text-debit" : "text-ink-muted")}>
            {errors.amount ||
              (lockedAmount
                ? "This is the amount they asked for."
                : isSend && Number.isFinite(balance)
                ? `You have ₹${formatAmount(balance)} available.`
                : `Up to ₹${formatAmount(MAX)}.`)}
          </p>
          {!lockedAmount && (
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK.map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => {
                    setAmount(String(q));
                    setErrors((x) => ({ ...x, amount: undefined }));
                  }}
                  className={cx(
                    "num rounded-sm border px-2.5 py-1 font-mono text-[12px] transition-colors",
                    value === q ? "border-ink bg-ink text-paper-raised" : "border-rule-strong text-ink-soft hover:border-ink"
                  )}
                >
                  ₹{formatAmount(q)}
                </button>
              ))}
            </div>
          )}
        </div>

        <Field
          label="Note (optional)"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setErrors((x) => ({ ...x, note: undefined }));
          }}
          maxLength={80}
          placeholder={isSend ? "What's it for?" : "e.g. Dinner on Friday"}
          error={errors.note}
          hint={note.length > 60 ? `${80 - note.length} characters left` : undefined}
        />

        <Button type="submit" size="lg" className="w-full" loading={submitting} loadingText="Sending request">
          {isSend ? "Review payment" : `Request${value ? ` ₹${formatAmount(value)}` : ""}`}
        </Button>
      </form>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/dashboard" className="text-[13px] text-ink-muted hover:text-ink">
      ← Overview
    </Link>
  );
}

function Row({ k, v, mono, big }) {
  return (
    <div className={cx("flex items-baseline justify-between gap-6", big && "py-3")}>
      <dt className="text-ink-muted">{k}</dt>
      <dd className={cx("truncate text-right", mono && "num font-mono")}>{v}</dd>
    </div>
  );
}

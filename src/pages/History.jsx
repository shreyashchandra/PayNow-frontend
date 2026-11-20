/* eslint-disable react/prop-types */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";
import { formatAmount, formatDateTime, fullName } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { Avatar, Button, Notice, Skeleton, cx } from "../components/ui";

const PAGE_SIZE = 25;
const EXPORT_CAP = 2000;

const DIRECTIONS = [
  { value: "", label: "All" },
  { value: "in", label: "Received" },
  { value: "out", label: "Sent" },
];

const PERIODS = [
  { value: "", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "month", label: "This month" },
  { value: "lastmonth", label: "Last month" },
];

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function periodRange(period) {
  const now = new Date();
  if (period === "7d") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: ymd(from), to: ymd(now) };
  }
  if (period === "month") {
    return { from: ymd(new Date(now.getFullYear(), now.getMonth(), 1)), to: ymd(now) };
  }
  if (period === "lastmonth") {
    return {
      from: ymd(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: ymd(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  }
  return {};
}

function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== today.getFullYear() && { year: "numeric" }),
  });
}

const timeOf = (date) =>
  new Date(date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export const History = () => {
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  // Filters live in the URL so refresh / back / sharing keep them.
  const direction = DIRECTIONS.some((d) => d.value === params.get("type")) ? params.get("type") : "";
  const period = PERIODS.some((p) => p.value === params.get("period")) ? params.get("period") : "";
  const [search, setSearch] = useState(() => params.get("q") || "");
  const q = useDebounced(search.trim(), 300);

  const setParam = useCallback(
    (key, value) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value) next.set(key, value);
          else next.delete(key);
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  useEffect(() => {
    if ((params.get("q") || "") !== q) setParam("q", q);
  }, [q, params, setParam]);

  const filters = useMemo(
    () => ({
      ...(direction && { direction }),
      ...(q && { q }),
      ...periodRange(period),
    }),
    [direction, q, period]
  );
  const filtered = Boolean(direction || q || period);

  const [state, setState] = useState({
    status: "loading",
    rows: [],
    cursor: null,
    hasMore: false,
    summary: null,
    error: null,
  });
  const [more, setMore] = useState({ loading: false, error: null });
  const [reloadKey, setReloadKey] = useState(0);
  const [openId, setOpenId] = useState(null);
  const [exporting, setExporting] = useState(false);
  const requestRef = useRef(0);

  // First page (and totals) whenever the filters change.
  useEffect(() => {
    const controller = new AbortController();
    const reqId = ++requestRef.current;
    setState((s) => ({ ...s, status: "loading", error: null }));
    setMore({ loading: false, error: null });
    setOpenId(null);

    api
      .get("/bank/transactions", {
        params: { ...filters, limit: PAGE_SIZE, summary: 1 },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (reqId !== requestRef.current) return;
        setState({
          status: "ready",
          rows: Array.isArray(data?.data) ? data.data : [],
          cursor: data?.nextCursor || null,
          hasMore: Boolean(data?.hasMore),
          summary: data?.summary || null,
          error: null,
        });
      })
      .catch((err) => {
        if (controller.signal.aborted || reqId !== requestRef.current) return;
        setState((s) => ({ ...s, status: "error", error: getErrorMessage(err, "Couldn't load your history.") }));
      });

    return () => controller.abort();
  }, [filters, reloadKey]);

  const loadMore = async () => {
    if (more.loading || !state.cursor) return;
    const reqId = requestRef.current;
    setMore({ loading: true, error: null });
    try {
      const { data } = await api.get("/bank/transactions", {
        params: { ...filters, limit: PAGE_SIZE, before: state.cursor },
      });
      if (reqId !== requestRef.current) return; // filters changed meanwhile
      setState((s) => {
        const seen = new Set(s.rows.map((r) => r._id));
        const fresh = (data?.data || []).filter((r) => !seen.has(r._id));
        return { ...s, rows: [...s.rows, ...fresh], cursor: data?.nextCursor || null, hasMore: Boolean(data?.hasMore) };
      });
      setMore({ loading: false, error: null });
    } catch (err) {
      setMore({ loading: false, error: getErrorMessage(err, "Couldn't load more.") });
    }
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const all = [];
      let cursor = null;
      do {
        const { data } = await api.get("/bank/transactions", {
          params: { ...filters, limit: 100, ...(cursor && { before: cursor }) },
        });
        all.push(...(data?.data || []));
        cursor = data?.hasMore ? data.nextCursor : null;
      } while (cursor && all.length < EXPORT_CAP);

      if (all.length === 0) {
        toast.info("Nothing to export for these filters.");
        return;
      }
      const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = [
        ["Date", "Time", "Type", "Name", "Amount (INR)", "Note", "Reference"].map(esc).join(","),
        ...all.map((t) =>
          [
            ymd(new Date(t.createdAt)),
            timeOf(t.createdAt),
            t.direction === "in" ? "Received" : "Sent",
            fullName(t.counterparty),
            t.direction === "in" ? t.amount : -t.amount,
            t.note || "",
            t._id,
          ]
            .map(esc)
            .join(",")
        ),
      ];
      const blob = new Blob(["﻿" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paynow-history-${ymd(new Date())}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(
        all.length >= EXPORT_CAP && cursor
          ? `Exported the latest ${EXPORT_CAP} transactions.`
          : `Exported ${all.length} transaction${all.length === 1 ? "" : "s"}.`
      );
    } catch (err) {
      toast.error(getErrorMessage(err, "Export failed. Please try again."));
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setParams({}, { replace: true });
  };

  // Group rows under day headings.
  const groups = useMemo(() => {
    const out = [];
    for (const t of state.rows) {
      const label = dayLabel(t.createdAt);
      const last = out[out.length - 1];
      if (last && last.label === label) last.rows.push(t);
      else out.push({ label, rows: [t] });
    }
    return out;
  }, [state.rows]);

  const summary = state.summary;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/dashboard" className="text-[13px] text-ink-muted hover:text-ink">
            ← Overview
          </Link>
          <h1 className="mt-3 font-serif text-[40px] leading-none tracking-tight">History</h1>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportCsv}
          loading={exporting}
          loadingText="Exporting"
          disabled={state.status !== "ready" || state.rows.length === 0}
        >
          Export CSV
        </Button>
      </div>

      {/* Totals */}
      <dl className="mt-8 grid grid-cols-3 border-y border-ink">
        <Stat label="Money in" value={summary?.totalIn} tone="in" loading={state.status === "loading" && !summary} />
        <Stat label="Money out" value={summary?.totalOut} tone="out" loading={state.status === "loading" && !summary} />
        <Stat
          label="Net"
          value={summary ? summary.totalIn - summary.totalOut : undefined}
          tone="net"
          loading={state.status === "loading" && !summary}
          hint={summary ? `${summary.count} transaction${summary.count === 1 ? "" : "s"}` : ""}
        />
      </dl>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <div role="group" aria-label="Type" className="flex shrink-0 rounded border border-rule-strong p-0.5">
          {DIRECTIONS.map((d) => (
            <button
              key={d.value || "all"}
              onClick={() => setParam("type", d.value)}
              aria-pressed={direction === d.value}
              className={cx(
                "h-9 flex-1 rounded-sm px-3.5 text-[13px] transition-colors md:flex-none",
                direction === d.value ? "bg-ink text-paper-raised" : "text-ink-soft hover:text-ink"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <label htmlFor="history-period" className="sr-only">
          Period
        </label>
        <select
          id="history-period"
          value={period}
          onChange={(e) => setParam("period", e.target.value)}
          className="h-10 shrink-0 rounded border border-rule-strong bg-paper-raised px-3 text-[14px] text-ink focus:border-ink focus:outline-none"
        >
          {PERIODS.map((p) => (
            <option key={p.value || "all"} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <label htmlFor="history-search" className="sr-only">
          Search by name
        </label>
        <input
          id="history-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name"
          className="h-10 w-full min-w-0 rounded border border-rule-strong bg-paper-raised px-3 text-[14px] placeholder:text-ink-faint focus:border-ink focus:outline-none md:flex-1"
        />
        {filtered && (
          <button onClick={clearFilters} className="shrink-0 text-[13px] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      <div className="mt-8">
        {state.status === "error" ? (
          <Notice
            tone="error"
            title="History didn't load"
            action={
              <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
                Retry
              </Button>
            }
          >
            {state.error}
          </Notice>
        ) : state.status === "loading" && state.rows.length === 0 ? (
          <div className="space-y-6">
            {[0, 1].map((g) => (
              <div key={g}>
                <Skeleton className="h-3 w-24" />
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 border-b border-rule py-4">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="ml-auto h-4 w-16" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : state.rows.length === 0 ? (
          <EmptyState filtered={filtered} onClear={clearFilters} />
        ) : (
          <div className={cx("space-y-8 transition-opacity", state.status === "loading" && "opacity-50")}>
            {groups.map((g) => (
              <section key={g.label}>
                <h2 className="eyebrow border-b border-rule pb-2">{g.label}</h2>
                <ul className="divide-y divide-rule">
                  {g.rows.map((t) => (
                    <Row
                      key={t._id}
                      t={t}
                      open={openId === t._id}
                      onToggle={() => setOpenId((id) => (id === t._id ? null : t._id))}
                    />
                  ))}
                </ul>
              </section>
            ))}

            <div className="flex flex-col items-center gap-2 pt-2">
              {more.error && <p className="text-[13px] text-debit">{more.error}</p>}
              {state.hasMore ? (
                <Button variant="secondary" onClick={loadMore} loading={more.loading} loadingText="Loading">
                  {more.error ? "Try again" : "Load older"}
                </Button>
              ) : (
                <p className="text-[13px] text-ink-faint">
                  {filtered ? "That's everything matching these filters." : "That's the beginning of your history."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Stat({ label, value, tone, loading, hint }) {
  const sign = !value ? "" : tone === "in" ? "+" : tone === "out" ? "−" : value > 0 ? "+" : "−";
  const color =
    tone === "in" ? "text-ledger" : tone === "out" ? "text-ink" : value < 0 ? "text-debit" : value > 0 ? "text-ledger" : "text-ink";
  return (
    <div className="border-r border-rule px-3 py-4 last:border-r-0 sm:px-5">
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5">
        {loading ? (
          <Skeleton className="h-7 w-24" />
        ) : (
          <span className={cx("num font-serif text-xl sm:text-[28px]", color)}>
            {value === undefined ? "—" : `${sign}₹${formatAmount(Math.abs(value))}`}
          </span>
        )}
      </dd>
      {hint && <p className="mt-0.5 hidden text-[12px] text-ink-muted sm:block">{hint}</p>}
    </div>
  );
}

function Row({ t, open, onToggle }) {
  const name = fullName(t.counterparty);
  const isIn = t.direction === "in";
  const canPay = t.counterparty?._id;
  const payUrl = canPay ? `/send?${new URLSearchParams({ id: t.counterparty._id, name })}` : null;

  return (
    <li>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 py-3.5 text-left hover:bg-paper-sunk/50"
      >
        <Avatar name={name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px]">
            <span className="text-ink-muted">{isIn ? "From " : "To "}</span>
            {name}
          </span>
          <span className="block truncate text-[12px] text-ink-muted">
            {timeOf(t.createdAt)}
            {t.note ? ` · “${t.note}”` : ""}
            {t.viaRequest ? " · for a request" : ""}
          </span>
        </span>
        <span className={cx("num shrink-0 font-mono text-[15px]", isIn ? "text-ledger" : "text-ink")}>
          {isIn ? "+" : "−"}₹{formatAmount(t.amount)}
        </span>
      </button>

      {open && (
        <div className="mb-4 ml-12 animate-slide-up rounded-sm border border-dashed border-rule-strong bg-paper-raised px-4 py-3 text-[13px]">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-ink-muted">Type</dt>
            <dd>{isIn ? "Received" : "Sent"}{t.viaRequest ? " (paid a request)" : ""}</dd>
            <dt className="text-ink-muted">When</dt>
            <dd>{formatDateTime(t.createdAt)}</dd>
            {t.note && (
              <>
                <dt className="text-ink-muted">Note</dt>
                <dd className="break-words">“{t.note}”</dd>
              </>
            )}
            <dt className="text-ink-muted">Reference</dt>
            <dd className="flex items-center gap-2">
              <span className="num font-mono">{String(t._id).slice(-10).toUpperCase()}</span>
              <CopyButton text={String(t._id)} />
            </dd>
          </dl>
          {payUrl && (
            <Link
              to={payUrl}
              className="mt-3 inline-block font-medium text-ledger underline underline-offset-4 hover:text-ledger-deep"
            >
              {isIn ? `Pay ${t.counterparty.firstName} back` : `Pay ${t.counterparty.firstName} again`}
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

function CopyButton({ text }) {
  const [state, setState] = useState("idle");
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
    } catch {
      setState("failed");
    }
    setTimeout(() => setState("idle"), 1500);
  };
  return (
    <button onClick={copy} className="text-[12px] text-ink-muted underline-offset-4 hover:text-ink hover:underline">
      {state === "done" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy"}
    </button>
  );
}

function EmptyState({ filtered, onClear }) {
  if (filtered) {
    return (
      <div className="border-y border-rule py-12 text-center">
        <p className="font-serif text-xl">Nothing matches.</p>
        <p className="mt-1 text-sm text-ink-muted">Try a different name or a wider time period.</p>
        <button onClick={onClear} className="mt-4 text-sm underline underline-offset-4 hover:text-ledger">
          Clear filters
        </button>
      </div>
    );
  }
  return (
    <div className="border-y border-rule py-12 text-center">
      <p className="font-serif text-xl">No transactions yet.</p>
      <p className="mt-1 text-sm text-ink-muted">Money you send or receive will be listed here, newest first.</p>
      <Link
        to="/dashboard"
        className="mt-5 inline-flex h-10 items-center rounded bg-ledger px-4 text-sm font-medium text-paper-raised hover:bg-ledger-deep"
      >
        Pay someone
      </Link>
    </div>
  );
}


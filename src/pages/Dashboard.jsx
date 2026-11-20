/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";
import { formatAmount, fullName, timeAgo } from "../lib/format";
import { useToast } from "../context/ToastContext";
import { payRequestUrl, useShell } from "../components/AppShell";
import { Avatar, Button, Notice, SectionHeading, Skeleton, cx } from "../components/ui";

export const Dashboard = () => {
  const { account, loadAccount } = useShell();
  const greeting = greet();

  return (
    <div className="space-y-14">
      <section>
        <p className="eyebrow">
          {greeting}
          {account.data?.firstName ? `, ${account.data.firstName}` : ""}
        </p>
        <BalanceBlock account={account} onRetry={loadAccount} />
      </section>

      <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <People />
        <div className="space-y-14">
          <OpenRequests />
          <Activity />
        </div>
      </div>
    </div>
  );
};

function greet() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function BalanceBlock({ account, onRetry }) {
  if (account.status === "loading") {
    return (
      <div className="mt-3">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="mt-3 h-4 w-40" />
      </div>
    );
  }
  if (account.status === "error" && !account.data) {
    return (
      <div className="mt-4 max-w-lg">
        <Notice
          tone="error"
          title="Your balance didn't load"
          action={
            <Button size="sm" variant="secondary" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {account.error}
        </Notice>
      </div>
    );
  }
  return (
    <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-2">
      <p className="num font-serif text-[56px] leading-none tracking-tight sm:text-[72px]">
        <span className="mr-1 align-top text-[0.45em] text-ink-muted">₹</span>
        {formatAmount(account.data?.balance)}
      </p>
      <div className="pb-2 text-[13px] text-ink-muted">
        <p>Available balance</p>
        <button
          onClick={onRetry}
          disabled={account.status === "refreshing"}
          className="underline-offset-4 hover:text-ink hover:underline disabled:no-underline"
        >
          {account.status === "refreshing" ? "Refreshing…" : "Refresh"}
        </button>
        {account.status === "error" && <span className="ml-2 text-debit">Couldn&apos;t refresh</span>}
      </div>
    </div>
  );
}

/* -------------------------------- People -------------------------------- */

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function People() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const filter = useDebounced(query.trim(), 300);
  const [page, setPage] = useState(1);
  const [state, setState] = useState({ status: "loading", users: [], totalPages: 1, total: 0, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => setPage(1), [filter]);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, status: "loading", error: null }));
    api
      .get("/user/bulk", { params: { filter, page, limit: 8 }, signal: controller.signal })
      .then(({ data }) =>
        setState({
          status: "ready",
          users: Array.isArray(data?.users) ? data.users : [],
          totalPages: data?.totalPages || 1,
          total: data?.total ?? data?.users?.length ?? 0,
          error: null,
        })
      )
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState((s) => ({ ...s, status: "error", error: getErrorMessage(err, "Couldn't load people.") }));
      });
    return () => controller.abort();
  }, [filter, page, reloadKey]);

  const go = (path, u) =>
    navigate(`${path}?${new URLSearchParams({ id: u._id, name: fullName(u) }).toString()}`);

  return (
    <section>
      <SectionHeading
        aside={
          state.status === "ready" && (
            <span className="num font-mono text-[12px] text-ink-muted">{state.total} people</span>
          )
        }
      >
        People
      </SectionHeading>

      <div className="mt-4">
        <label htmlFor="people-search" className="sr-only">
          Search people
        </label>
        <input
          id="people-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name"
          className="h-11 w-full rounded border border-rule-strong bg-paper-raised px-3 text-[15px] placeholder:text-ink-faint focus:border-ink focus:outline-none"
        />
      </div>

      {state.status === "error" ? (
        <div className="mt-4">
          <Notice
            tone="error"
            action={
              <Button size="sm" variant="secondary" onClick={() => setReloadKey((k) => k + 1)}>
                Retry
              </Button>
            }
          >
            {state.error}
          </Notice>
        </div>
      ) : state.status === "loading" && state.users.length === 0 ? (
        <ul className="mt-2 divide-y divide-rule">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-3">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-4 w-40" />
            </li>
          ))}
        </ul>
      ) : state.users.length === 0 ? (
        <p className="mt-6 text-sm text-ink-muted">
          {filter ? (
            <>No one called &ldquo;{filter}&rdquo; yet. Check the spelling, or invite them to sign up.</>
          ) : (
            <>You&apos;re the first one here. Once friends sign up, they&apos;ll show up in this list.</>
          )}
        </p>
      ) : (
        <ul className={cx("mt-2 divide-y divide-rule transition-opacity", state.status === "loading" && "opacity-50")}>
          {state.users.map((u) => (
            <li key={u._id} className="flex items-center gap-3 py-3">
              <Avatar name={fullName(u)} />
              <span className="min-w-0 flex-1 truncate">{fullName(u)}</span>
              <Button size="sm" variant="quiet" onClick={() => go("/request", u)} className="px-2 text-[13px]">
                Request
              </Button>
              <Button size="sm" onClick={() => go("/send", u)}>
                Pay
              </Button>
            </li>
          ))}
        </ul>
      )}

      {state.totalPages > 1 && state.status !== "error" && (
        <div className="mt-4 flex items-center justify-between border-t border-rule pt-3 text-[13px]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || state.status === "loading"}
            className="text-ink-soft hover:text-ink disabled:text-ink-faint"
          >
            ← Previous
          </button>
          <span className="num font-mono text-ink-muted">
            {page} / {state.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(state.totalPages, p + 1))}
            disabled={page >= state.totalPages || state.status === "loading"}
            className="text-ink-soft hover:text-ink disabled:text-ink-faint"
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------- Requests ------------------------------- */

function OpenRequests() {
  const { requests, loadRequests } = useShell();
  const toast = useToast();
  const [busy, setBusy] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#requests") ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const decline = async (r) => {
    if (busy) return;
    setBusy(r._id);
    try {
      await api.post(`/bank/request/${r._id}/decline`);
      toast.info(`Declined ${fullName(r.requestFromIdId)}'s request.`);
      await loadRequests();
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't decline that request."));
      loadRequests();
    } finally {
      setBusy(null);
    }
  };

  return (
    <section id="requests" ref={ref} className="scroll-mt-24">
      <SectionHeading>Waiting on you</SectionHeading>
      {requests.status === "loading" ? (
        <Skeleton className="mt-4 h-12 w-full" />
      ) : requests.status === "error" && requests.data.length === 0 ? (
        <div className="mt-4">
          <Notice
            tone="error"
            action={
              <Button size="sm" variant="secondary" onClick={loadRequests}>
                Retry
              </Button>
            }
          >
            {requests.error}
          </Notice>
        </div>
      ) : requests.data.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No open requests. You&apos;re all square.</p>
      ) : (
        <ul className="mt-2 divide-y divide-rule">
          {requests.data.map((r) => (
            <li key={r._id} className="py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm">
                  <span className="font-medium">{fullName(r.requestFromIdId)}</span>
                  <span className="text-ink-muted"> asked for</span>
                </p>
                <span className="num shrink-0 font-mono text-[15px]">₹{formatAmount(r.amountRequested)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-[12px] text-ink-muted">
                  {r.note ? `“${r.note}” · ` : ""}
                  {timeAgo(r.createdAt)}
                </p>
                <div className="flex shrink-0 items-center gap-3">
                  <Button
                    variant="quiet"
                    className="text-[13px]"
                    onClick={() => decline(r)}
                    disabled={busy === r._id}
                  >
                    {busy === r._id ? "Declining…" : "Decline"}
                  </Button>
                  <Link
                    to={payRequestUrl(r)}
                    className="text-[13px] font-medium text-ledger underline underline-offset-4 hover:text-ledger-deep"
                  >
                    Pay
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------- Activity ------------------------------- */

function Activity() {
  const { account } = useShell();
  const [state, setState] = useState({ status: "loading", data: [], error: null });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const { data } = await api.get("/bank/transactions", { params: { limit: 8 } });
      setState({ status: "ready", data: Array.isArray(data?.data) ? data.data : [], error: null });
    } catch (err) {
      if (err.response?.status === 404) {
        // Older backend without history: hide quietly instead of erroring.
        setState({ status: "unsupported", data: [], error: null });
        return;
      }
      setState((s) => ({ ...s, status: "error", error: getErrorMessage(err, "Couldn't load activity.") }));
    }
  }, []);

  // Reload whenever the balance changes (after a payment or a refresh).
  const balance = account.data?.balance;
  useEffect(() => {
    load();
  }, [load, balance]);

  if (state.status === "unsupported") return null;

  return (
    <section>
      <SectionHeading>Recent activity</SectionHeading>
      {state.status === "loading" && state.data.length === 0 ? (
        <div className="mt-4 space-y-3">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
      ) : state.status === "error" ? (
        <div className="mt-4">
          <Notice
            tone="error"
            action={
              <Button size="sm" variant="secondary" onClick={load}>
                Retry
              </Button>
            }
          >
            {state.error}
          </Notice>
        </div>
      ) : state.data.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">Nothing yet. Your payments will be listed here.</p>
      ) : (
        <ul className="mt-2 divide-y divide-rule">
          {state.data.map((t) => (
            <li key={t._id} className="flex items-baseline justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm">
                  <span className="text-ink-muted">{t.direction === "out" ? "To " : "From "}</span>
                  {fullName(t.counterparty)}
                </p>
                <p className="truncate text-[12px] text-ink-muted">
                  {t.note ? `“${t.note}” · ` : ""}
                  {timeAgo(t.createdAt)}
                </p>
              </div>
              <span
                className={cx("num shrink-0 font-mono text-[15px]", t.direction === "in" ? "text-ledger" : "text-ink")}
              >
                {t.direction === "in" ? "+" : "−"}₹{formatAmount(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

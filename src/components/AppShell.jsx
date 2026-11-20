/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import { api, getErrorMessage } from "../lib/api";
import { formatAmount, fullName, timeAgo } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Logo } from "./Logo";
import { Avatar, cx } from "./ui";

/**
 * Layout for signed-in pages. Owns the account (balance, name) and the list of
 * incoming money requests so every page shares one copy and one refresh.
 */
export function AppShell() {
  const { user, updateUser, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [account, setAccount] = useState({ status: "loading", data: null, error: null });
  const [requests, setRequests] = useState({ status: "loading", data: [], error: null });

  const loadAccount = useCallback(async () => {
    setAccount((a) => ({ ...a, status: a.data ? "refreshing" : "loading", error: null }));
    try {
      const { data } = await api.get("/bank/balance");
      setAccount({ status: "ready", data, error: null });
      updateUser({ firstName: data.firstName, lastName: data.lastName, username: data.username });
    } catch (err) {
      if (err.response?.status === 401) return;
      setAccount((a) => ({ ...a, status: "error", error: getErrorMessage(err, "Couldn't load your balance.") }));
    }
  }, [updateUser]);

  const loadRequests = useCallback(async () => {
    try {
      const { data } = await api.get("/bank/request/list");
      setRequests({ status: "ready", data: Array.isArray(data?.data) ? data.data : [], error: null });
    } catch (err) {
      if (err.response?.status === 401) return;
      setRequests((r) => ({ ...r, status: "error", error: getErrorMessage(err, "Couldn't load requests.") }));
    }
  }, []);

  useEffect(() => {
    loadAccount();
    loadRequests();
  }, [loadAccount, loadRequests]);

  // Refresh when the tab regains focus, so balances don't go stale.
  useEffect(() => {
    let last = Date.now();
    const onFocus = () => {
      if (Date.now() - last < 30000) return;
      last = Date.now();
      loadAccount();
      loadRequests();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadAccount, loadRequests]);

  const setBalance = useCallback((balance) => {
    setAccount((a) => (a.data ? { ...a, data: { ...a.data, balance } } : a));
  }, []);

  const handleSignOut = () => {
    signOut();
    toast.info("Signed out. See you soon.");
    navigate("/signin", { replace: true });
  };

  const name = account.data ? fullName(account.data) : user ? fullName(user) : "";

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo to="/dashboard" />
            <nav className="hidden items-center gap-6 text-sm sm:flex">
              <TopLink to="/dashboard">Overview</TopLink>
              <TopLink to="/update-user">Profile</TopLink>
            </nav>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <RequestsMenu requests={requests} key={location.pathname} />
            <NavLink
              to="/update-user"
              className="flex items-center gap-2 rounded px-1.5 py-1 hover:bg-paper-sunk"
              title="Profile"
            >
              <Avatar name={name} size="sm" tone="ink" />
              <span className="hidden text-sm text-ink-soft md:inline">{user?.firstName || ""}</span>
            </NavLink>
            <button
              onClick={handleSignOut}
              className="rounded px-2 py-1.5 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <Outlet context={{ account, requests, loadAccount, loadRequests, setBalance }} />
      </main>
    </div>
  );
}

export const useShell = () => useOutletContext();

function TopLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cx(
          "border-b py-1 transition-colors",
          isActive ? "border-ink text-ink" : "border-transparent text-ink-muted hover:text-ink"
        )
      }
    >
      {children}
    </NavLink>
  );
}

function RequestsMenu({ requests }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const count = requests.data.length;

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-ink-soft hover:bg-paper-sunk hover:text-ink"
      >
        Requests
        <span
          className={cx(
            "num min-w-[20px] rounded-sm px-1 text-center font-mono text-[11px] leading-5",
            count ? "bg-debit text-paper-raised" : "bg-paper-sunk text-ink-muted"
          )}
        >
          {requests.status === "loading" ? "·" : requests.status === "error" && !count ? "–" : count}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] animate-slide-up rounded border border-rule-strong bg-paper-raised shadow-[0_12px_32px_-16px_rgba(26,26,23,0.4)]">
          <p className="eyebrow border-b border-rule px-4 py-2.5">Waiting on you</p>
          {requests.status === "error" ? (
            <p className="px-4 py-5 text-sm text-debit">{requests.error}</p>
          ) : count === 0 ? (
            <p className="px-4 py-5 text-sm text-ink-muted">Nobody is asking you for money. Nice.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-rule overflow-auto">
              {requests.data.slice(0, 6).map((r) => (
                <li key={r._id}>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate(payRequestUrl(r));
                    }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-paper"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{fullName(r.requestFromIdId)}</span>
                      <span className="block truncate text-[12px] text-ink-muted">
                        {r.note ? `“${r.note}” · ` : ""}
                        {timeAgo(r.createdAt)}
                      </span>
                    </span>
                    <span className="num shrink-0 font-mono text-sm">₹{formatAmount(r.amountRequested)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {count > 6 && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/dashboard#requests");
              }}
              className="w-full border-t border-rule px-4 py-2.5 text-left text-[13px] text-ink-soft hover:text-ink"
            >
              See all {count} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export const payRequestUrl = (r) => {
  const p = new URLSearchParams({
    id: r.requestFromIdId?._id || "",
    name: fullName(r.requestFromIdId),
    amount: String(r.amountRequested || ""),
    request: r._id,
  });
  if (r.note) p.set("note", r.note);
  return `/send?${p.toString()}`;
};

/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

const TONES = {
  success: { bar: "bg-ledger", label: "Done" },
  error: { bar: "bg-debit", label: "Problem" },
  info: { bar: "bg-ink", label: "Note" },
  warning: { bar: "bg-amber", label: "Heads up" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (tone, message, { duration } = {}) => {
      if (!message) return;
      const id = ++idRef.current;
      setToasts((t) => {
        // Don't stack identical messages (e.g. several failed requests at once).
        const rest = t.filter((x) => x.message !== message);
        return [...rest.slice(-3), { id, tone, message }];
      });
      const ms = duration ?? (tone === "error" ? 7000 : 4000);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m, o) => push("success", m, o),
      error: (m, o) => push("error", m, o),
      info: (m, o) => push("info", m, o),
      warning: (m, o) => push("warning", m, o),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => {
          const tone = TONES[t.tone] || TONES.info;
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up overflow-hidden rounded border border-rule-strong bg-paper-raised shadow-[0_1px_0_#c4bca9,0_8px_24px_-12px_rgba(26,26,23,0.35)]"
            >
              <span className={`w-1 shrink-0 ${tone.bar}`} />
              <div className="flex-1 px-4 py-3">
                <p className="eyebrow">{tone.label}</p>
                <p className="mt-0.5 text-sm text-ink">{t.message}</p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="px-3 text-ink-muted hover:text-ink"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
};

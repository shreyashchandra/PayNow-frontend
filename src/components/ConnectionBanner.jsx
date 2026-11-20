import { useEffect, useState, useSyncExternalStore } from "react";
import { connection, warmUp } from "../lib/api";

// Explains the two things that most often look like "the app is broken":
// a sleeping free-tier server, and the user being offline.
export function ConnectionBanner() {
  const { slow, down } = useSyncExternalStore(connection.subscribe, connection.get);
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  let text = null;
  let tone = "bg-ink text-paper-raised";
  if (!online) {
    text = "You're offline. We'll pick up where you left off once you're back.";
    tone = "bg-debit text-paper-raised";
  } else if (slow) {
    text = "Waking up the server. Free hosting naps when idle, so the first request can take up to a minute.";
  } else if (down) {
    text = "We can't reach the server right now.";
    tone = "bg-amber text-paper-raised";
  }

  if (!text) return null;

  return (
    <div role="status" className={`sticky top-0 z-40 ${tone}`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2 text-[13px] sm:px-6">
        <p className="flex items-center gap-2">
          {slow && online && (
            <span className="inline-flex gap-[3px]">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1 w-1 animate-tick rounded-full bg-current"
                  style={{ animationDelay: `${i * 160}ms` }}
                />
              ))}
            </span>
          )}
          {text}
        </p>
        {down && online && !slow && (
          <button onClick={() => warmUp()} className="shrink-0 underline underline-offset-4">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

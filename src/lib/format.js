const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const formatAmount = (n) => (Number.isFinite(Number(n)) ? inr.format(Number(n)) : "—");

export const fullName = (u) =>
  [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim() || "Unknown";

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("") || "?";

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const s = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(s);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
  if (abs < 86400 * 6) return rtf.format(Math.round(s / 86400), "day");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const isObjectId = (v) => typeof v === "string" && /^[a-f0-9]{24}$/i.test(v);

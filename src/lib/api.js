import axios from "axios";
import { storage } from "./storage";

export const API_URL = (
  import.meta.env.VITE_API_URL || "https://paynow-backend.onrender.com/api/v1"
).replace(/\/+$/, "");

// Render's free tier sleeps when idle and can take ~50s to wake up.
const TIMEOUT_MS = 75000;
const SLOW_AFTER_MS = 4000;
const RETRY_DELAYS = [1500, 4000, 8000];
const RETRYABLE_STATUS = new Set([502, 503, 504]);

export const api = axios.create({ baseURL: API_URL, timeout: TIMEOUT_MS });

/* ------------------------------------------------------------------ */
/* Connection status: lets the UI tell people when the server is slow. */
/* ------------------------------------------------------------------ */

let status = { slow: false, down: false };
const listeners = new Set();
let slowCount = 0;

const setStatus = (patch) => {
  const next = { ...status, ...patch };
  if (next.slow === status.slow && next.down === status.down) return;
  status = next;
  listeners.forEach((l) => l());
};

export const connection = {
  get: () => status,
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

/* --------------------------------------------- */
/* Auth: token header and a global 401 handler. */
/* --------------------------------------------- */

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

api.interceptors.request.use((config) => {
  const token = storage.get("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  config.__slowTimer = setTimeout(() => {
    config.__markedSlow = true;
    slowCount += 1;
    setStatus({ slow: true });
  }, SLOW_AFTER_MS);
  return config;
});

const settle = (config) => {
  if (!config) return;
  clearTimeout(config.__slowTimer);
  if (config.__markedSlow) {
    config.__markedSlow = false;
    slowCount = Math.max(0, slowCount - 1);
    if (slowCount === 0) setStatus({ slow: false });
  }
};

const isRetryable = (error) => {
  if (axios.isCancel(error)) return false;
  if (!error.response) return error.code !== "ECONNABORTED"; // network error, not our own timeout
  return RETRYABLE_STATUS.has(error.response.status);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

api.interceptors.response.use(
  (response) => {
    settle(response.config);
    setStatus({ down: false, ...(slowCount === 0 && { slow: false }) });
    return response;
  },
  async (error) => {
    const config = error.config;
    settle(config);

    if (error.response?.status === 401 && config?.headers?.Authorization) {
      onUnauthorized(error.response.data?.msg);
      return Promise.reject(error);
    }

    // Only retry calls that are safe to repeat: GETs, or ones that opt in.
    const method = (config?.method || "get").toLowerCase();
    const canRetry = config && (method === "get" || config.retry === true);
    const attempt = config?.__attempt || 0;

    if (canRetry && isRetryable(error) && attempt < RETRY_DELAYS.length) {
      config.__attempt = attempt + 1;
      setStatus({ slow: true });
      await wait(RETRY_DELAYS[attempt]);
      return api.request(config);
    }

    // Out of retries (or not retryable): stop saying "waking up".
    setStatus({
      ...(slowCount === 0 && { slow: false }),
      ...(isRetryable(error) && { down: true }),
    });
    return Promise.reject(error);
  }
);

/** Wake the server early so the first real request isn't the slow one. */
export const warmUp = () =>
  api.get("/health", { timeout: TIMEOUT_MS }).catch(() => {
    /* status banner already reflects failures */
  });

/* ------------------------------------------ */
/* Turning any failure into a human sentence. */
/* ------------------------------------------ */

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline. Check your connection and try again.";
  }
  if (error.code === "ECONNABORTED") {
    return "The server took too long to respond. It may be waking up, so try again in a moment.";
  }
  if (!error.response) {
    return "Couldn't reach PayNow. The server may be starting up; give it a minute and retry.";
  }
  const { status: code, data } = error.response;
  const msg = data?.msg || data?.message;
  if (msg && typeof msg === "string") return msg;
  if (code === 502 || code === 503 || code === 504) {
    return "PayNow is temporarily unavailable. Please try again shortly.";
  }
  if (code === 429) return "Too many attempts. Wait a few seconds and try again.";
  return fallback;
}

export const getFieldErrors = (error) => error?.response?.data?.fields || {};

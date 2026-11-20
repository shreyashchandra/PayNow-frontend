/* eslint-disable react/prop-types, react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setUnauthorizedHandler } from "../lib/api";
import { storage } from "../lib/storage";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [token, setToken] = useState(() => storage.get("token"));
  const [user, setUser] = useState(() => storage.getJSON("user"));

  const signIn = useCallback((nextToken, nextUser) => {
    storage.set("token", nextToken);
    if (nextUser) storage.set("user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser || null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      storage.set("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    storage.remove("token");
    storage.remove("user");
    setToken(null);
    setUser(null);
  }, []);

  // Any API call that comes back 401 ends the session everywhere.
  useEffect(() => {
    setUnauthorizedHandler((msg) => {
      if (!storage.get("token")) return;
      signOut();
      toast.warning(msg || "Your session ended. Please sign in again.");
    });
  }, [signOut, toast]);

  // Keep tabs in sync: signing out in one tab signs out the others.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(e.newValue);
      if (e.key === "user") setUser(storage.getJSON("user"));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ token, user, isAuthed: Boolean(token), signIn, signOut, updateUser }),
    [token, user, signIn, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};

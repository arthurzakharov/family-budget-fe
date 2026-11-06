import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthStatus } from "@arthurzakharov/family-budget-be-client";
import { api, call, type JsonRequest } from "@client/api";

type AuthContextValue = {
  status: AuthStatus;
  // Sends an auth request (e.g. `api.auth.login.$post(...)`); on success the returned
  // status becomes current. Returns an error code, or null on success.
  send: (request: JsonRequest<AuthStatus>) => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    // When the backend cannot be reached, show the login screen; logging in then says why.
    call(api.auth.status.$get()).then(result => setStatus(result.ok ? result.data : { stage: "none" }));
  }, []);

  const send: AuthContextValue["send"] = async request => {
    const result = await call(request);
    if (!result.ok) return result.error;
    setStatus(result.data);
    return null;
  };

  // Nothing is shown until we know whether someone is logged in.
  if (!status) return null;

  return <AuthContext value={{ status, send }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

// The logged-in user; only use below the point where the app checks stage === "user".
export function useCurrentUser() {
  const { status } = useAuth();
  if (status.stage !== "user") throw new Error("No user is logged in");
  return status.user;
}

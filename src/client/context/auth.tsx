import type { ReactNode } from "react";
import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { AuthStatus } from "@arthurzakharov/family-budget-be-client";
import { api, call, request, type JsonRequest } from "@client/api";

// Who is logged in. Only auth requests change it, so it is never fetched again on its own.
const authQuery = queryOptions({
  queryKey: ["auth"],
  // When the backend cannot be reached, show the login screen; logging in then says why.
  queryFn: async (): Promise<AuthStatus> => {
    const result = await call(api.auth.status.$get());
    return result.ok ? result.data : { stage: "none" };
  },
  staleTime: Infinity,
  retry: false,
});

const userId = (status: AuthStatus | undefined) => (status?.stage === "user" ? status.user.id : null);

// Makes `status` current. Cached data belongs to the user who loaded it, so it is dropped
// when someone else logs in (or nobody is logged in any more).
function setStatus(qc: QueryClient, status: AuthStatus) {
  const previous = qc.getQueryData(authQuery.queryKey);
  qc.setQueryData(authQuery.queryKey, status);
  if (userId(previous) !== userId(status)) {
    qc.removeQueries({ predicate: query => query.queryKey[0] !== "auth" });
  }
}

// Nothing is shown until we know whether someone is logged in.
export function AuthProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(authQuery);
  return data ? children : null;
}

// The current auth status; only use inside AuthProvider.
export function useAuth() {
  const { data } = useQuery(authQuery);
  if (!data) throw new Error("useAuth must be used inside AuthProvider");
  return { status: data };
}

// An auth request (log in, sign up, log out...); on success the returned status becomes current.
// Its `error` holds the failure (see errorCode) and `isPending` is true while it runs.
export function useAuthMutation<V = void>(send: (vars: V) => JsonRequest<AuthStatus>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: V) => request(send(vars)),
    onSuccess: status => setStatus(qc, status),
  });
}

// The logged-in user; only use below the point where the app checks stage === "user".
export function useCurrentUser() {
  const { status } = useAuth();
  if (status.stage !== "user") throw new Error("No user is logged in");
  return status.user;
}

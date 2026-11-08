// Everything the app reads from family-budget-be goes through TanStack Query, so each list is
// fetched once and shared by every page that shows it. Changes made here put the server's
// answer straight into the cache instead of loading the whole list again.
import { QueryClient, queryOptions, useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, ApiError, request } from "@client/api";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Other family members change data too, so it is refreshed now and then, but not on
      // every page visit: within 5 minutes switching pages needs no requests.
      staleTime: 5 * 60_000,
      // The backend's own answers (e.g. "not allowed") will not change on a retry; only an
      // unreachable backend (Render waking up) is worth trying again.
      retry: (failureCount, error) =>
        failureCount < 3 && (!(error instanceof ApiError) || error.code === "errors.unavailable"),
    },
  },
});

export const queries = {
  groups: queryOptions({ queryKey: ["groups"], queryFn: () => request(api.groups.$get()) }),
  members: queryOptions({ queryKey: ["members"], queryFn: () => request(api.members.$get()) }),
  // The workspace's login email
  workspace: queryOptions({ queryKey: ["workspace"], queryFn: () => request(api.auth.workspace.$get()) }),
  // Admin only
  users: queryOptions({ queryKey: ["users"], queryFn: () => request(api.users.$get()) }),

  cryptoCoins: queryOptions({ queryKey: ["crypto", "coins"], queryFn: () => request(api.crypto.coins.$get()) }),
  // The workspace's last fetched coin prices. Fetching new ones costs a call to the price API,
  // so it only happens when someone presses "Update prices" (see useUpdatePrices).
  cryptoPrices: queryOptions({ queryKey: ["crypto", "prices"], queryFn: () => request(api.crypto.prices.$get()) }),
  cryptoTransactions: queryOptions({
    queryKey: ["crypto", "transactions"],
    queryFn: () => request(api.crypto.transactions.$get()),
  }),

  expenseCategories: queryOptions({
    queryKey: ["expenses", "categories"],
    queryFn: () => request(api.expenses.categories.$get()),
  }),
  expenseEntries: queryOptions({ queryKey: ["expenses", "entries"], queryFn: () => request(api.expenses.entries.$get()) }),

  depositTransactions: queryOptions({
    queryKey: ["deposit", "transactions"],
    queryFn: () => request(api.deposit.transactions.$get()),
  }),
  depositRates: queryOptions({ queryKey: ["deposit", "rates"], queryFn: () => request(api.deposit.rates.$get()) }),
  // Worked out by the server from the transactions and rates, so it is fetched again when they change.
  depositInterest: queryOptions({ queryKey: ["deposit", "interest"], queryFn: () => request(api.deposit.interest.$get()) }),
};

type Record = { id: string };

// `list` with `item` added, or replacing the item with the same id.
const upsert = <T extends Record>(list: T[] | undefined, item: T) =>
  list?.some(x => x.id === item.id) ? list.map(x => (x.id === item.id ? item : x)) : [...(list ?? []), item];

type Options = {
  // Other queries the server works out from this list; they are fetched again after a change.
  invalidates?: QueryKey[];
};

// Adds or changes one record of a cached list; the saved record replaces the cached one.
export function useSaveMutation<T extends Record, V>(
  list: { queryKey: QueryKey },
  mutationFn: (vars: V) => Promise<T>,
  { invalidates = [] }: Options = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: saved => {
      qc.setQueryData<T[]>(list.queryKey, cached => upsert(cached, saved));
      for (const queryKey of invalidates) qc.invalidateQueries({ queryKey });
    },
  });
}

// Deletes one record (by id) of a cached list.
export function useDeleteMutation<T extends Record>(
  list: { queryKey: QueryKey },
  mutationFn: (id: string) => Promise<unknown>,
  { invalidates = [] }: Options = {},
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (_, id) => {
      qc.setQueryData<T[]>(list.queryKey, cached => cached?.filter(x => x.id !== id));
      for (const queryKey of invalidates) qc.invalidateQueries({ queryKey });
    },
  });
}

// For endpoints that answer with the whole, updated list (coins, categories).
export function useReplaceMutation<T, V>(list: { queryKey: QueryKey }, mutationFn: (vars: V) => Promise<T>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: data => qc.setQueryData<T>(list.queryKey, data),
  });
}

// Shared empty list, so components that get no data yet do not re-render for a new [] each time.
export const none: never[] = [];

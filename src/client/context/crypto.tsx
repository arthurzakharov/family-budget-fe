import { useQuery } from "@tanstack/react-query";
import { api, request } from "@client/api";
import { none, queries, useReplaceMutation } from "@client/queries";
import { latestPrices } from "@shared/crypto";

// The crypto page's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useCrypto() {
  const groups = useQuery(queries.groups);
  const members = useQuery(queries.members);
  const cryptoCoins = useQuery(queries.cryptoCoins);
  const cryptoTransactions = useQuery(queries.cryptoTransactions);
  const cryptoPrices = useQuery(queries.cryptoPrices);
  // Only the records of groups this user may see; the server leaves out the rest.
  const transactions = cryptoTransactions.data ?? none;
  return {
    // Some of the data has not arrived yet (e.g. while the backend wakes up)
    isLoading:
      groups.isPending || members.isPending || cryptoCoins.isPending || cryptoTransactions.isPending || cryptoPrices.isPending,
    groups: groups.data ?? none,
    members: members.data ?? none,
    // Coins the admin has made available for new records
    coins: cryptoCoins.data ?? none,
    transactions,
    // What each coin is worth now: its last fetched price, or else the price it was last traded at.
    prices: { ...latestPrices(transactions), ...cryptoPrices.data?.prices },
    // When the prices were last fetched (ISO 8601); null if never
    pricesFetchedAt: cryptoPrices.data?.fetchedAt ?? null,
  };
}

// Fetches current prices for the coins the admin made available. The backend asks the price API
// at most once a minute and keeps the answer for everyone in the workspace.
export function useUpdatePrices() {
  return useReplaceMutation(queries.cryptoPrices, () => request(api.crypto.prices.$post()));
}

import { useQuery } from "@tanstack/react-query";
import { none, queries } from "@client/queries";
import { latestPrices } from "@shared/crypto";

// The crypto page's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useCrypto() {
  // Only the records of groups this user may see; the server leaves out the rest.
  const transactions = useQuery(queries.cryptoTransactions).data ?? none;
  return {
    groups: useQuery(queries.groups).data ?? none,
    members: useQuery(queries.members).data ?? none,
    // Coins the admin has made available for new records
    coins: useQuery(queries.cryptoCoins).data ?? none,
    transactions,
    // What each coin is worth now. For now: the price it was last traded at; live prices will replace this later.
    prices: latestPrices(transactions),
  };
}

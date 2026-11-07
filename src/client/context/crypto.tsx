import { useQuery } from "@tanstack/react-query";
import { none, queries } from "@client/queries";
import { latestPrices } from "@shared/crypto";

// The crypto page's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useCrypto() {
  const groups = useQuery(queries.groups);
  const members = useQuery(queries.members);
  const cryptoCoins = useQuery(queries.cryptoCoins);
  const cryptoTransactions = useQuery(queries.cryptoTransactions);
  // Only the records of groups this user may see; the server leaves out the rest.
  const transactions = cryptoTransactions.data ?? none;
  return {
    // Some of the data has not arrived yet (e.g. while the backend wakes up)
    isLoading: groups.isPending || members.isPending || cryptoCoins.isPending || cryptoTransactions.isPending,
    groups: groups.data ?? none,
    members: members.data ?? none,
    // Coins the admin has made available for new records
    coins: cryptoCoins.data ?? none,
    transactions,
    // What each coin is worth now. For now: the price it was last traded at; live prices will replace this later.
    prices: latestPrices(transactions),
  };
}

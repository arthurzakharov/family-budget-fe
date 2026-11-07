import { useQuery } from "@tanstack/react-query";
import { none, queries } from "@client/queries";
import type { InterestSummary } from "@arthurzakharov/family-budget-be-client";

const noInterest: InterestSummary = { balance: 0, payouts: [], gross: 0, tax: 0, net: 0, pending: 0, byGroup: {} };

// The deposit's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useDeposit() {
  const groups = useQuery(queries.groups);
  const members = useQuery(queries.members);
  const depositTransactions = useQuery(queries.depositTransactions);
  const depositRates = useQuery(queries.depositRates);
  const depositInterest = useQuery(queries.depositInterest);
  return {
    // Some of the data has not arrived yet (e.g. while the backend wakes up)
    isLoading: groups.isPending || members.isPending || depositTransactions.isPending || depositRates.isPending || depositInterest.isPending,
    groups: groups.data ?? none,
    members: members.data ?? none,
    // Only the transactions of groups this user may see; the server leaves out the rest.
    transactions: depositTransactions.data ?? none,
    rates: depositRates.data ?? none,
    // Worked out by the server on the whole deposit, narrowed to the user's groups
    interest: depositInterest.data ?? noInterest,
  };
}

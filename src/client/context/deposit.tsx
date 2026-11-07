import { useQuery } from "@tanstack/react-query";
import { none, queries } from "@client/queries";
import type { InterestSummary } from "@arthurzakharov/family-budget-be-client";

const noInterest: InterestSummary = { balance: 0, payouts: [], gross: 0, tax: 0, net: 0, pending: 0, byGroup: {} };

// The deposit's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useDeposit() {
  return {
    groups: useQuery(queries.groups).data ?? none,
    members: useQuery(queries.members).data ?? none,
    // Only the transactions of groups this user may see; the server leaves out the rest.
    transactions: useQuery(queries.depositTransactions).data ?? none,
    rates: useQuery(queries.depositRates).data ?? none,
    // Worked out by the server on the whole deposit, narrowed to the user's groups
    interest: useQuery(queries.depositInterest).data ?? noInterest,
  };
}

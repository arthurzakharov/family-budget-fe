// The backend works out the interest; this only narrows its answer for the group tabs.
import type { InterestSummary, PerGroup } from "@arthurzakharov/family-budget-be-client";

// German capital gains tax plus solidarity surcharge (a share of that tax), as the
// backend withholds them. Only shown in labels here.
export const CAPITAL_GAINS_TAX = 0.25;
export const SOLIDARITY_SURCHARGE = 0.055;

// The same summary narrowed to some groups: their share only, with totals that add up
// their parts. Payouts the groups earned nothing in are left out. All amounts in cents.
export function forGroups(summary: InterestSummary, groupIds: string[]): InterestSummary {
  const keys = groupIds.filter(k => summary.byGroup[k]);
  if (Object.keys(summary.byGroup).every(k => keys.includes(k))) return summary;

  const pick = (values: PerGroup): PerGroup => Object.fromEntries(keys.map(k => [k, values[k] ?? 0]));
  const total = (values: PerGroup) => keys.reduce((s, k) => s + (values[k] ?? 0), 0);
  const payouts = summary.payouts
    .map(p => ({
      date: p.date,
      gross: total(p.grossByGroup),
      tax: total(p.taxByGroup),
      net: total(p.netByGroup),
      grossByGroup: pick(p.grossByGroup),
      taxByGroup: pick(p.taxByGroup),
      netByGroup: pick(p.netByGroup),
      balance: total(p.balanceByGroup),
      balanceByGroup: pick(p.balanceByGroup),
    }))
    .filter(p => p.gross > 0);
  const byGroup = Object.fromEntries(keys.map(k => [k, summary.byGroup[k]!]));
  const sum = (key: "gross" | "tax" | "net" | "balance" | "pending") => keys.reduce((s, k) => s + byGroup[k]![key], 0);

  return {
    balance: sum("balance"),
    payouts,
    gross: sum("gross"),
    tax: sum("tax"),
    net: sum("net"),
    pending: sum("pending"),
    byGroup,
  };
}

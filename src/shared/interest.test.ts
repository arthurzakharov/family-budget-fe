import { expect, test } from "bun:test";
import type { InterestSummary } from "@arthurzakharov/family-budget-be-client";
import { forGroups } from "@shared/interest";

const group = (added: number, net: number) => ({ added, gross: net + 1, tax: 1, net, balance: added + net, pending: 0.5 });

const summary: InterestSummary = {
  balance: 30030,
  payouts: [
    {
      date: "2026-02-01",
      gross: 32,
      tax: 2,
      net: 30,
      grossByGroup: { a: 22, b: 10 },
      taxByGroup: { a: 1, b: 1 },
      netByGroup: { a: 21, b: 9 },
      balance: 30030,
      balanceByGroup: { a: 20021, b: 10009 },
    },
    {
      date: "2026-03-01",
      gross: 5,
      tax: 0,
      net: 5,
      grossByGroup: { a: 5, b: 0 },
      taxByGroup: { a: 0, b: 0 },
      netByGroup: { a: 5, b: 0 },
      balance: 30035,
      balanceByGroup: { a: 20026, b: 10009 },
    },
  ],
  gross: 37,
  tax: 2,
  net: 35,
  pending: 1,
  byGroup: { a: group(20000, 26), b: group(10000, 9) },
};

test("all groups give the summary unchanged", () => {
  expect(forGroups(summary, ["a", "b"])).toBe(summary);
});

test("one group gets its own share, without payouts it earned nothing in", () => {
  const b = forGroups(summary, ["b"]);
  expect(b.payouts.map(p => [p.date, p.gross, p.net, p.balance])).toEqual([["2026-02-01", 10, 9, 10009]]);
  expect(b).toMatchObject({ balance: 10009, gross: 10, tax: 1, net: 9, pending: 0.5 });
  expect(Object.keys(b.byGroup)).toEqual(["b"]);
});

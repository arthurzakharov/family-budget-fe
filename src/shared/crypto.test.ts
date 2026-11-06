import { expect, test } from "bun:test";
import type { CryptoTransaction } from "@arthurzakharov/family-budget-be-client";
import { latestPrices, summarizeCrypto } from "@shared/crypto";

const tx = (over: Partial<CryptoTransaction>): CryptoTransaction => ({
  id: crypto.randomUUID(),
  userId: "u",
  groupId: "g1",
  coin: "BTC",
  type: "buy",
  date: "2026-01-01",
  amount: 1,
  price: 100,
  ...over,
});

test("latest price per coin follows the latest date", () => {
  const prices = latestPrices([
    tx({ date: "2026-03-01", price: 300 }),
    tx({ date: "2026-01-01", price: 100 }),
    tx({ coin: "ETH", price: 10 }),
  ]);
  expect(prices).toEqual({ BTC: 300, ETH: 10 });
});

test("summary adds up coins, money and value per coin and per group", () => {
  const transactions = [
    tx({ amount: 2, price: 100 }),
    tx({ type: "sell", amount: 0.5, price: 200, date: "2026-02-01" }),
    tx({ groupId: "g2", coin: "ETH", amount: 10, price: 5 }),
  ];
  const s = summarizeCrypto(transactions, { BTC: 200, ETH: 5 }, ["g1", "g2", "g3"]);
  expect(s.byCoin.BTC).toEqual({ bought: 2, sold: 0.5, held: 1.5, added: 100, value: 300 });
  expect(s.byCoin.ETH).toEqual({ bought: 10, sold: 0, held: 10, added: 50, value: 50 });
  expect(s.byGroup.g1!.value).toBe(300);
  expect(s.byGroup.g2!.added).toBe(50);
  expect(s.byGroup.g3!.value).toBe(0);
  expect(s.added).toBe(150);
  expect(s.value).toBe(350);
});

import { expect, test } from "bun:test";
import type { Category, ExpenseEntry } from "@arthurzakharov/family-budget-be-client";
import { kindOf, summarizeEntries } from "@shared/expenses";

const categories: Category[] = [
  { id: "groceries", kind: "expense", name: null, hidden: false },
  { id: "salary", kind: "income", name: null, hidden: false },
  { id: "c1", kind: "income", name: "Pocket money", hidden: true },
];

const entry = (over: Partial<ExpenseEntry>): ExpenseEntry => ({
  id: crypto.randomUUID(),
  userId: "u",
  groupId: "g1",
  categoryId: "groceries",
  date: "2026-01-01",
  amountCents: 1000,
  note: "",
  ...over,
});

test("summary splits income and expenses per category and group, in cents", () => {
  const s = summarizeEntries(
    [
      entry({ amountCents: 3010 }),
      entry({ amountCents: 20 }),
      entry({ categoryId: "salary", amountCents: 100000, groupId: "g2" }),
      entry({ categoryId: "c1", amountCents: 500 }),
    ],
    categories,
    ["g1", "g2", "g3"],
  );
  expect(s).toMatchObject({ income: 100500, expenses: 3030, net: 97470 });
  expect(s.byCategory).toEqual({ groceries: 3030, salary: 100000, c1: 500 });
  expect(s.byGroup.g1).toEqual({ income: 500, expenses: 3030, net: -2530 });
  expect(s.byGroup.g3).toEqual({ income: 0, expenses: 0, net: 0 });
});

test("a category that is gone counts as an expense", () => {
  expect(kindOf(categories, "salary")).toBe("income");
  expect(kindOf(categories, "deleted")).toBe("expense");
});

import type { Category, CategoryKind, ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

// Every category is in one of two lists.
export const categoryKinds: CategoryKind[] = ["expense", "income"];

// The backend's limit on a note's length.
export const MAX_NOTE_LENGTH = 200;

// Income adds, expenses take away. A category that is gone counts as an expense.
export function kindOf(categories: Category[], categoryId: string): CategoryKind {
  return categories.find(c => c.id === categoryId)?.kind ?? "expense";
}

// In cents.
export const signedEntry = (categories: Category[], e: ExpenseEntry) =>
  kindOf(categories, e.categoryId) === "income" ? e.amountCents : -e.amountCents;

// All in cents.
export type Totals = { income: number; expenses: number; net: number };

export type EntrySummary = Totals & {
  // Total amount per category id
  byCategory: Record<string, number>;
  byGroup: Record<string, Totals>;
};

// Adds up income and expenses, in total, per category and per group. Amounts are whole
// cents, so the sums are exact.
// `groupIds` lists groups to report even when they have no records yet.
export function summarizeEntries(
  entries: ExpenseEntry[],
  categories: Category[],
  groupIds: string[] = [],
): EntrySummary {
  const zero = (): Totals => ({ income: 0, expenses: 0, net: 0 });
  const total = zero();
  const byCategory: Record<string, number> = {};
  const byGroup: Record<string, Totals> = Object.fromEntries(groupIds.map(id => [id, zero()]));

  const add = (t: Totals, e: ExpenseEntry) => {
    if (kindOf(categories, e.categoryId) === "income") t.income += e.amountCents;
    else t.expenses += e.amountCents;
    t.net = t.income - t.expenses;
  };

  for (const e of entries) {
    add(total, e);
    add((byGroup[e.groupId] ??= zero()), e);
    byCategory[e.categoryId] = (byCategory[e.categoryId] ?? 0) + e.amountCents;
  }

  return { ...total, byCategory, byGroup };
}

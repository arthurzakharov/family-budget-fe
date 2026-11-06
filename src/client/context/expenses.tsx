import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, load } from "@client/api";
import type { Category, ExpenseEntry, Group, Member } from "@arthurzakharov/family-budget-be-client";

type ExpensesData = {
  groups: Group[];
  members: Member[];
  // All categories, hidden ones too, so old records still show their category's name
  categories: Category[];
  // Only the records of groups this user may see; the server leaves out the rest.
  entries: ExpenseEntry[];
  setCategories: (categories: Category[]) => void;
  setEntries: (entries: ExpenseEntry[]) => void;
};

const ExpensesContext = createContext<ExpensesData | null>(null);

// Loads the expenses page once for all of its tabs, so switching tabs needs no new requests.
export function ExpensesProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<ExpenseEntry[]>([]);

  useEffect(() => {
    load(api.groups.$get(), setGroups);
    load(api.members.$get(), setMembers);
    load(api.expenses.categories.$get(), setCategories);
    load(api.expenses.entries.$get(), setEntries);
  }, []);

  return (
    <ExpensesContext value={{ groups, members, categories, entries, setCategories, setEntries }}>
      {children}
    </ExpensesContext>
  );
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) throw new Error("useExpenses must be used inside ExpensesProvider");
  return context;
}

// A category's name: built-in ones are translated, custom ones are shown as the admin typed them.
export function useCategoryName() {
  const { categories } = useExpenses();
  return (t: (key: string) => string, id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return "?";
    return category.name ?? t(`category.${category.id}`);
  };
}

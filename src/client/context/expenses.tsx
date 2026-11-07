import { useQuery } from "@tanstack/react-query";
import { none, queries } from "@client/queries";

// The expenses page's data, shared by all of its tabs. Each list comes from the query cache, so
// switching tabs (or coming back to the page) needs no new requests.
export function useExpenses() {
  const groups = useQuery(queries.groups);
  const members = useQuery(queries.members);
  const expenseCategories = useQuery(queries.expenseCategories);
  const expenseEntries = useQuery(queries.expenseEntries);
  return {
    // Some of the data has not arrived yet (e.g. while the backend wakes up)
    isLoading: groups.isPending || members.isPending || expenseCategories.isPending || expenseEntries.isPending,
    groups: groups.data ?? none,
    members: members.data ?? none,
    // All categories, hidden ones too, so old records still show their category's name
    categories: expenseCategories.data ?? none,
    // Only the records of groups this user may see; the server leaves out the rest.
    entries: expenseEntries.data ?? none,
  };
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

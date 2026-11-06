import { Overview } from "@client/components/expenses/Overview";
import { useCurrentUser } from "@client/context/auth";
import { useExpenses } from "@client/context/expenses";

// The admin sees every group here; everyone else only the groups they belong to.
export function General() {
  const me = useCurrentUser();
  const { groups, entries } = useExpenses();
  // Groups only known from records count too, so the admin sees all money.
  const all = [...new Set([...groups.map(g => g.id), ...entries.map(e => e.groupId)])];
  const groupIds = all.filter(id => me.role === "admin" || me.groupIds.includes(id));
  return <Overview groupIds={groupIds} />;
}

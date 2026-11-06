import { Overview } from "@client/components/crypto/Overview";
import { useCurrentUser } from "@client/context/auth";
import { useCrypto } from "@client/context/crypto";

// The admin sees every group here; everyone else only the groups they belong to.
export function General() {
  const me = useCurrentUser();
  const { groups, transactions } = useCrypto();
  // Groups only known from records count too, so the admin sees all coins.
  const all = [...new Set([...groups.map(g => g.id), ...transactions.map(tx => tx.groupId)])];
  const groupIds = all.filter(id => me.role === "admin" || me.groupIds.includes(id));
  return <Overview groupIds={groupIds} />;
}

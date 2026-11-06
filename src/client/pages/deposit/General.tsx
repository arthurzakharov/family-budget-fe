import { Overview } from "@client/components/deposit/Overview";
import { useCurrentUser } from "@client/context/auth";
import { useDeposit } from "@client/context/deposit";

// The admin sees every group here; everyone else only the groups they belong to.
export function General() {
  const me = useCurrentUser();
  const { interest } = useDeposit();
  // byGroup also has groups only known from transactions, so the admin sees all money.
  const groupIds = Object.keys(interest.byGroup).filter(id => me.role === "admin" || me.groupIds.includes(id));
  return <Overview groupIds={groupIds} showRates />;
}

import { getRouteApi } from "@tanstack/react-router";
import { Overview } from "@client/components/expenses/Overview";

const route = getRouteApi("/protected/expenses/groups/$groupId");

// The router has already checked that the group exists and the user may see it.
export function GroupTab() {
  const { groupId } = route.useParams();
  return <Overview groupIds={[groupId]} />;
}

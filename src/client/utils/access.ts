import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

// The admin sees every group; everyone else only the groups they belong to.
export const canSeeGroup = (user: PublicUser, groupId: string) =>
  user.role === "admin" || user.groupIds.includes(groupId);

export const visibleGroups = (user: PublicUser, groups: Group[]) => groups.filter(g => canSeeGroup(user, g.id));

// Only the admin and users in several groups have a choice of group. A user in one group
// has nothing to pick in forms, and a tab for their group would only repeat General.
export const hasSeveralGroups = (user: PublicUser) => user.role === "admin" || user.groupIds.length > 1;

export const hasGroupTabs = hasSeveralGroups;

export const canOpenGroupTab = (user: PublicUser, groupId: string) =>
  hasGroupTabs(user) && canSeeGroup(user, groupId);

import { Link } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasGroupTabs, visibleGroups } from "@client/utils/access";
import { canEdit } from "@shared/roles";
import type { Group } from "@arthurzakharov/family-budget-be-client";

// The pages that share this tab layout, and where each of their tabs lives.
const paths = {
  deposit: { general: "/deposit", group: "/deposit/groups/$groupId", manage: "/deposit/manage" },
  crypto: { general: "/crypto", group: "/crypto/groups/$groupId", manage: "/crypto/manage" },
  expenses: { general: "/expenses", group: "/expenses/groups/$groupId", manage: "/expenses/manage" },
} as const;

type Props = {
  section: keyof typeof paths;
  groups: Group[];
  // Admin-only tabs after Manage records, e.g. the crypto page's coin list
  adminTabs?: { to: "/crypto/coins" | "/expenses/categories"; label: string }[];
};

// Tabs of a money page: General, one per group the user may see, Manage records
// (not for viewers) and any admin-only tabs.
export function SectionTabs({ section, groups, adminTabs = [] }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const to = paths[section];
  const groupTabs = hasGroupTabs(me) ? visibleGroups(me, groups) : [];
  const extra = me.role === "admin" ? adminTabs : [];
  const count = 1 + groupTabs.length + (canEdit(me) ? 1 : 0) + extra.length;

  // With a single tab there is nothing to switch between.
  if (count === 1) return null;

  return (
    <nav className="tabs">
      <Link to={to.general} activeProps={{ className: "active" }} activeOptions={{ exact: true }}>
        {t("tabs.general")}
      </Link>
      {groupTabs.map(g => (
        <Link key={g.id} to={to.group} params={{ groupId: g.id }} activeProps={{ className: "active" }}>
          {g.name}
        </Link>
      ))}
      {canEdit(me) && (
        <Link to={to.manage} activeProps={{ className: "active" }}>
          {t("tabs.manage")}
        </Link>
      )}
      {extra.map(tab => (
        <Link key={tab.to} to={tab.to} activeProps={{ className: "active" }}>
          {t(tab.label)}
        </Link>
      ))}
    </nav>
  );
}

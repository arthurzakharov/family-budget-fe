import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Tabs } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasGroupTabs, visibleGroups } from "@client/utils/access";
import { canEdit } from "@shared/roles";
import type { Group } from "@arthurzakharov/family-budget-be-client";

// The pages that share this tab layout, and where each of their tabs lives.
const paths = {
  deposit: { general: "/deposit", group: (id: string) => `/deposit/groups/${id}`, manage: "/deposit/manage" },
  crypto: { general: "/crypto", group: (id: string) => `/crypto/groups/${id}`, manage: "/crypto/manage" },
  expenses: { general: "/expenses", group: (id: string) => `/expenses/groups/${id}`, manage: "/expenses/manage" },
} as const;

type Props = {
  section: keyof typeof paths;
  groups: Group[];
  // Admin-only tabs after Manage records, e.g. the crypto page's coin list
  adminTabs?: { to: "/crypto/coins" | "/expenses/categories"; label: string }[];
};

// Tabs of a money page: General, one per group the user may see, Manage records
// (not for viewers) and any admin-only tabs. Each tab is a route; the selected tab
// follows the URL.
export function SectionTabs({ section, groups, adminTabs = [] }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname.replace(/\/+$/, "") || "/" });
  const to = paths[section];
  const groupTabs = hasGroupTabs(me) ? visibleGroups(me, groups) : [];
  const extra = me.role === "admin" ? adminTabs : [];

  const tabs = [
    { id: to.general, label: t("tabs.general") },
    ...groupTabs.map(g => ({ id: to.group(g.id), label: g.name })),
    ...(canEdit(me) ? [{ id: to.manage, label: t("tabs.manage") }] : []),
    ...extra.map(tab => ({ id: tab.to, label: t(tab.label) })),
  ];

  // With a single tab there is nothing to switch between.
  if (tabs.length === 1) return null;

  return (
    <Tabs
      className="mb-6"
      selectedKey={pathname}
      onSelectionChange={key => navigate({ to: String(key) as never })}
    >
      <Tabs.ListContainer>
        <Tabs.List aria-label={t(`nav.${section}`)}>
          {tabs.map(tab => (
            <Tabs.Tab key={tab.id} id={tab.id} className="whitespace-nowrap">
              {tab.label}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
}

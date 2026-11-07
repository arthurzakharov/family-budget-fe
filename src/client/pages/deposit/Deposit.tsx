import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";

// The deposit page: tabs (General, one per group, Manage records) above the open tab.
export function Deposit() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t("nav.deposit")} />
      <Tabs />
      <Outlet />
    </>
  );
}

function Tabs() {
  const { groups } = useDeposit();
  return <SectionTabs section="deposit" groups={groups} />;
}

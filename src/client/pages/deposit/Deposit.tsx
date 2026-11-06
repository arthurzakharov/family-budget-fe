import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { DepositProvider, useDeposit } from "@client/context/deposit";
import { SectionTabs } from "@client/components/SectionTabs";

// The deposit page: tabs (General, one per group, Manage records) above the open tab.
export function Deposit() {
  const { t } = useI18n();
  return (
    <DepositProvider>
      <h1>{t("nav.deposit")}</h1>
      <Tabs />
      <Outlet />
    </DepositProvider>
  );
}

function Tabs() {
  const { groups } = useDeposit();
  return <SectionTabs section="deposit" groups={groups} />;
}

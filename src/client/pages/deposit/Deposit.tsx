import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";
import { TablesLoading } from "@client/components/RecordTable";

// The deposit page: tabs (General, one per group, Manage records) above the open tab.
export function Deposit() {
  const { t } = useI18n();
  const { isLoading } = useDeposit();
  return (
    <>
      <PageHeader title={t("nav.deposit")} />
      <Tabs />
      {/* Every tab's tables show a spinner until the page's data has arrived. */}
      <TablesLoading isLoading={isLoading}>
        <Outlet />
      </TablesLoading>
    </>
  );
}

function Tabs() {
  const { groups } = useDeposit();
  return <SectionTabs section="deposit" groups={groups} />;
}

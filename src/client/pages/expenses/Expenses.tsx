import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useExpenses } from "@client/context/expenses";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";
import { TablesLoading } from "@client/components/RecordTable";

// The expenses page: the same tabs as the deposit, plus the admin's category lists.
export function Expenses() {
  const { t } = useI18n();
  const { isLoading } = useExpenses();
  return (
    <>
      <PageHeader title={t("nav.expenses")} />
      <Tabs />
      {/* Every tab's tables show a spinner until the page's data has arrived. */}
      <TablesLoading isLoading={isLoading}>
        <Outlet />
      </TablesLoading>
    </>
  );
}

function Tabs() {
  const { groups } = useExpenses();
  return (
    <SectionTabs
      section="expenses"
      groups={groups}
      adminTabs={[{ to: "/expenses/categories", label: "expenses.categories" }]}
    />
  );
}

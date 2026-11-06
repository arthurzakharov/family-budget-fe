import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { ExpensesProvider, useExpenses } from "@client/context/expenses";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";

// The expenses page: the same tabs as the deposit, plus the admin's category lists.
export function Expenses() {
  const { t } = useI18n();
  return (
    <ExpensesProvider>
      <PageHeader title={t("nav.expenses")} />
      <Tabs />
      <Outlet />
    </ExpensesProvider>
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

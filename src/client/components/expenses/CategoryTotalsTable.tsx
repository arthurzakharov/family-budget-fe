import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { formatCents } from "@client/utils/format";
import { kindOf, type EntrySummary } from "@shared/expenses";
import type { CategoryKind } from "@arthurzakharov/family-budget-be-client";

// Income and expenses per category, largest first, with the totals and what is left.
export function CategoryTotalsTable({ summary }: { summary: EntrySummary }) {
  const { t } = useI18n();
  const { categories } = useExpenses();
  const categoryName = useCategoryName();

  const rows = (kind: CategoryKind) =>
    Object.entries(summary.byCategory)
      .filter(([id]) => kindOf(categories, id) === kind)
      .sort(([, a], [, b]) => b - a)
      .map(([id, amount]) => (
        <tr key={id}>
          <td>{categoryName(t, id)}</td>
          <td>{formatCents(amount)}</td>
        </tr>
      ));

  const section = (kind: CategoryKind, total: number) => (
    <>
      <tr>
        <th>{t(kind === "income" ? "expenses.income" : "expenses.expenses")}</th>
        <th>{formatCents(total)}</th>
      </tr>
      {rows(kind)}
    </>
  );

  return (
    <table>
      <thead>
        <tr>
          <th>{t("expenses.category")}</th>
          <th>{t("transactions.amount")}</th>
        </tr>
      </thead>
      <tbody>
        {section("income", summary.income)}
        {section("expense", summary.expenses)}
      </tbody>
      <tfoot>
        <tr>
          <th>{t("expenses.net")}</th>
          <td>{formatCents(summary.net)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

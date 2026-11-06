import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { DataTable, Money } from "@client/components/ui";
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
        <Table.Row key={`${kind}-${id}`} id={`${kind}-${id}`}>
          <Table.Cell className="pl-6">{categoryName(t, id)}</Table.Cell>
          <Table.Cell>
            <Money cents={amount} format={formatCents} />
          </Table.Cell>
        </Table.Row>
      ));

  // A bold subtotal row heading each list.
  const total = (id: string, label: string, cents: number, signed?: boolean) => (
    <Table.Row key={id} id={id} className="[&>td]:font-semibold">
      <Table.Cell>{label}</Table.Cell>
      <Table.Cell>
        <Money cents={cents} format={formatCents} signed={signed} />
      </Table.Cell>
    </Table.Row>
  );

  return (
    <DataTable
      label={t("expenses.byCategory")}
      columns={
        <>
          <Table.Column isRowHeader>{t("expenses.category")}</Table.Column>
          <Table.Column>{t("transactions.amount")}</Table.Column>
        </>
      }
    >
      {[
        total("income", t("expenses.income"), summary.income),
        ...rows("income"),
        total("expense", t("expenses.expenses"), summary.expenses),
        ...rows("expense"),
        total("net", t("expenses.net"), summary.net, true),
      ]}
    </DataTable>
  );
}

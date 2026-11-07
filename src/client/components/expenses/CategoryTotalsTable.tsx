import { useMemo } from "react";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { Money } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { formatCents } from "@client/utils/format";
import { kindOf, type EntrySummary } from "@shared/expenses";
import type { CategoryKind } from "@arthurzakharov/family-budget-be-client";

// A bold subtotal ("total") or one category under it.
type Row = { id: string; label: string; cents: number; isTotal: boolean; signed: boolean };

const column = recordColumns<Row>();

// Income and expenses per category, largest first, each list under its subtotal, then what is
// left. The rows are grouped, so the table is not sortable.
export function CategoryTotalsTable({ summary }: { summary: EntrySummary }) {
  const { t } = useI18n();
  const { categories } = useExpenses();
  const categoryName = useCategoryName();

  const categoryRows = (kind: CategoryKind): Row[] =>
    Object.entries(summary.byCategory)
      .filter(([id]) => kindOf(categories, id) === kind)
      .sort(([, a], [, b]) => b - a)
      .map(([id, cents]) => ({ id: `${kind}-${id}`, label: categoryName(t, id), cents, isTotal: false, signed: false }));

  const total = (id: string, label: string, cents: number, signed = false): Row => ({ id, label, cents, isTotal: true, signed });

  const rows = [
    total("income", t("expenses.income"), summary.income),
    ...categoryRows("income"),
    total("expense", t("expenses.expenses"), summary.expenses),
    ...categoryRows("expense"),
    total("net", t("expenses.net"), summary.net, true),
  ];

  const columns = useMemo(
    () => [
      column.accessor("label", {
        header: t("expenses.category"),
        meta: { isRowHeader: true },
        cell: ({ row, getValue }) => <span className={row.original.isTotal ? undefined : "pl-4"}>{getValue()}</span>,
      }),
      column.accessor("cents", {
        header: t("transactions.amount"),
        cell: ({ row, getValue }) => <Money cents={getValue()} format={formatCents} signed={row.original.signed} />,
      }),
    ],
    [t],
  );

  return (
    <RecordTable
      label={t("expenses.byCategory")}
      data={rows}
      columns={columns}
      getRowId={row => row.id}
      rowClassName={row => (row.isTotal ? "[&>td]:font-semibold" : undefined)}
      paged={false}
    />
  );
}

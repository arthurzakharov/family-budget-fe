import { useMemo } from "react";
import { useI18n } from "@client/context/i18n";
import { moneyColumn, RecordTable, recordColumns } from "@client/components/RecordTable";
import { formatCents, nameOf } from "@client/utils/format";
import type { EntrySummary } from "@shared/expenses";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: EntrySummary;
  groupIds: string[];
  groups: Group[];
};

type Row = { id: string; name: string; income: number; expenses: number; net: number };

const column = recordColumns<Row>();

// Per group: income, expenses and what is left.
export function GroupTotalsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  const rows = useMemo(
    () =>
      groupIds.map((id): Row => ({ id, name: nameOf(groups, id), ...(summary.byGroup[id] ?? { income: 0, expenses: 0, net: 0 }) })),
    [summary, groupIds, groups],
  );

  const columns = useMemo(
    () => [
      column.accessor("name", { header: t("transactions.group"), enableSorting: true, sortFn: "text", meta: { isRowHeader: true } }),
      column.accessor("income", moneyColumn(t("expenses.income"), formatCents)),
      column.accessor("expenses", moneyColumn(t("expenses.expenses"), formatCents)),
      column.accessor("net", moneyColumn(t("expenses.net"), formatCents, true)),
    ],
    [t],
  );

  return <RecordTable label={t("perGroup.title")} data={rows} columns={columns} getRowId={row => row.id} paged={false} />;
}

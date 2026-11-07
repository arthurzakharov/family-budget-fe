import { useMemo } from "react";
import { useI18n } from "@client/context/i18n";
import { moneyColumn, RecordTable, recordColumns } from "@client/components/RecordTable";
import { formatCents, formatMoney, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

type GroupInterest = InterestSummary["byGroup"][string];
type Row = GroupInterest & { id: string; name: string; gainedPercent: number | null };

const column = recordColumns<Row>();

// Per group: money added, interest earned, and what the group's share is worth now.
export function GroupSummaryTable({ interest, groups }: Props) {
  const { t } = useI18n();

  const rows = useMemo(
    () =>
      Object.entries(interest.byGroup).map(
        ([id, s]): Row => ({ ...s, id, name: nameOf(groups, id), gainedPercent: s.added > 0 ? (s.net / s.added) * 100 : null }),
      ),
    [interest, groups],
  );

  const columns = useMemo(
    () => [
      column.accessor("name", { header: t("transactions.group"), enableSorting: true, sortFn: "text", meta: { isRowHeader: true } }),
      column.accessor("added", moneyColumn(t("perGroup.added"), formatCents)),
      column.accessor("gross", moneyColumn(t("totals.interestBeforeTax"), formatCents)),
      column.accessor("tax", moneyColumn(t("common.tax"), formatCents)),
      column.accessor("net", moneyColumn(t("totals.interestAfterTax"), formatCents)),
      column.accessor(row => row.gainedPercent ?? -Infinity, {
        id: "gained",
        header: t("perGroup.gained"),
        enableSorting: true,
        sortFn: "basic",
        cell: ({ row }) => (row.original.gainedPercent === null ? "–" : formatMoney(row.original.gainedPercent)),
        meta: { className: "tabular-nums" },
      }),
      column.accessor("balance", moneyColumn(t("common.balance"), formatCents)),
    ],
    [t],
  );

  return <RecordTable label={t("perGroup.title")} data={rows} columns={columns} getRowId={row => row.id} paged={false} />;
}

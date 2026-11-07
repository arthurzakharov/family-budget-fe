import { useMemo } from "react";
import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { Money } from "@client/components/ui";
import { moneyColumn, RecordTable, recordColumns } from "@client/components/RecordTable";
import { formatCents, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

type Payout = InterestSummary["payouts"][number];

const column = recordColumns<Payout>();

// Monthly interest payouts, with a column per group when there is more than one. One row a
// month, so the list grows and is split into pages.
export function PayoutTable({ interest, groups }: Props) {
  const { t } = useI18n();
  // Groups in the order they were created, plus any only known from transactions.
  const groupIds = Object.keys(interest.byGroup);
  const groupColumns = groupIds.length > 1 ? groupIds : [];
  const groupKey = groupColumns.join(",");

  const columns = useMemo(
    () => [
      column.accessor("date", {
        header: t("common.date"),
        enableSorting: true,
        sortFn: "basic",
        meta: { isRowHeader: true, className: "whitespace-nowrap" },
      }),
      column.accessor("gross", moneyColumn(t("payouts.beforeTax"), formatCents)),
      column.accessor("tax", moneyColumn(t("common.tax"), formatCents)),
      column.accessor("net", moneyColumn(t("payouts.afterTax"), formatCents)),
      ...groupColumns.map(id =>
        column.accessor(p => p.netByGroup[id] ?? 0, {
          id: `group-${id}`,
          header: t("payouts.groupAfterTax", { group: nameOf(groups, id) }),
          enableSorting: true,
          sortFn: "basic",
          cell: ({ getValue }) => <Money cents={getValue()} format={formatCents} />,
        }),
      ),
      column.accessor("balance", moneyColumn(t("common.balance"), formatCents)),
    ],
    // groupKey stands in for groupColumns, which is a new array on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, groups, groupKey],
  );

  const money = (cents: number) => <Money cents={cents} format={formatCents} />;

  return (
    <RecordTable
      label={t("payouts.title")}
      emptyText={t("payouts.empty")}
      data={interest.payouts}
      columns={columns}
      getRowId={p => p.date}
      footer={
        <Table.Row key="total" id="total" className="[&>td]:font-semibold">
          <Table.Cell>{t("common.total")}</Table.Cell>
          <Table.Cell>{money(interest.gross)}</Table.Cell>
          <Table.Cell>{money(interest.tax)}</Table.Cell>
          <Table.Cell>{money(interest.net)}</Table.Cell>
          {groupColumns.map(id => (
            <Table.Cell key={id}>{money(interest.byGroup[id]!.net)}</Table.Cell>
          ))}
          <Table.Cell> </Table.Cell>
        </Table.Row>
      }
    />
  );
}

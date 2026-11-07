import { useMemo } from "react";
import { useI18n } from "@client/context/i18n";
import { editingRow, RowActions } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { addedBy } from "@client/utils/format";
import type { DepositRate, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  rates: DepositRate[];
  members: Member[];
  // Shows an Edit button on each row when given
  onEdit?: (rate: DepositRate) => void;
  editingId?: string | null;
};

const column = recordColumns<DepositRate>();

// The deposit's rate periods, oldest first.
export function RateTable({ rates, members, onEdit, editingId }: Props) {
  const { t } = useI18n();

  const columns = useMemo(
    () => [
      column.accessor("ratePercent", {
        header: t("rates.rate"),
        enableSorting: true,
        sortFn: "basic",
        meta: { isRowHeader: true, className: "tabular-nums" },
      }),
      // "From the beginning" is sorted as "" so it comes first.
      column.accessor(r => r.from ?? "", {
        id: "from",
        header: t("rates.from"),
        enableSorting: true,
        sortFn: "basic",
        cell: ({ row }) => row.original.from ?? t("rates.beginning"),
        meta: { className: "whitespace-nowrap" },
      }),
      column.accessor("till", {
        header: t("rates.till"),
        cell: ({ getValue }) => getValue() ?? t("rates.current"),
        meta: { className: "whitespace-nowrap" },
      }),
      column.display({ id: "addedBy", header: t("common.addedBy"), cell: ({ row }) => addedBy(members, row.original.userId, t) }),
      ...(onEdit
        ? [
            column.display({
              id: "actions",
              header: " ",
              meta: { ariaLabel: t("common.edit") },
              cell: ({ row }) => <RowActions onEdit={() => onEdit(row.original)} />,
            }),
          ]
        : []),
    ],
    [t, members, onEdit],
  );

  return (
    <RecordTable
      label={t("rates.title")}
      emptyText={t("rates.empty")}
      data={rates}
      columns={columns}
      getRowId={r => r.id}
      rowClassName={r => editingRow(r.id === editingId)}
      initialSorting={[{ id: "from", desc: false }]}
      paged={false}
    />
  );
}
